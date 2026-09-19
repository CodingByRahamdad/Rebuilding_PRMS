import mongoose from 'mongoose';
import { PaymentModel, IPayment } from './models/payment.model';
import { GetPaymentsQuery } from './payments.validation';
import { memoryStore, InMemoryPayment } from '../../shared/database/memory-store';
import { assertDatabaseConnection, isDemoModeEnabled, isDbConnected } from '../../shared/database/db-guard';

export class PaymentRepository {
  public async create(data: Partial<IPayment>): Promise<IPayment> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await PaymentModel.create(data);
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose create payment failed, using memory store:', err);
      }
    }

    const newId = (data as any).id || `pay-${Date.now()}`;
    const invoiceCode = (data as any).invoiceCode || (data as any).invoiceNo || (data as any).invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
    const serviceName = data.serviceName || (data as any).serviceType || (data as any).description || 'Medical Service';
    const amount = Number(data.amount || (data as any).totalAmount || 0);
    const paidAmount = (data as any).paidAmount !== undefined ? Number((data as any).paidAmount) : (data.status === 'Paid' || (data.status as any) === 'Completed' ? amount : 0);

    // If exists in memoryStore, update it instead of adding duplicate
    const existingIndex = memoryStore.payments.findIndex(
      (p) => (p._id === newId || p.id === newId || p.invoiceCode === invoiceCode) && !p.isDeleted
    );

    const newPayment: InMemoryPayment = {
      _id: newId,
      id: newId,
      invoiceCode,
      patientId: String(data.patientId || 'p-1'),
      patientName: data.patientName || 'Patient',
      serviceName,
      amount,
      paidAmount,
      status: (data.status as any) || 'Pending',
      date: data.date || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || data.date || new Date().toISOString().split('T')[0],
      paymentMethod: (data.paymentMethod as any) || 'Credit Card',
      insuranceProvider: (data as any).insuranceProvider || '',
      claimId: (data as any).claimId || '',
      partialReason: (data as any).partialReason || '',
      nextPaymentDate: (data as any).nextPaymentDate || '',
      transactionId: data.transactionId || `TXN-${Date.now()}`,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (existingIndex >= 0) {
      memoryStore.payments[existingIndex] = { ...memoryStore.payments[existingIndex], ...newPayment };
      return memoryStore.payments[existingIndex] as unknown as IPayment;
    }

    memoryStore.payments.unshift(newPayment);
    return newPayment as unknown as IPayment;
  }

  public async findById(id: string): Promise<IPayment | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const payment = await PaymentModel.findOne({ _id: id, isDeleted: false }).exec();
        if (payment) return payment;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findById payment failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const payment = memoryStore.payments.find((p) => (p._id === id || p.id === id) && !p.isDeleted);
    if (!payment) return null;
    return payment as unknown as IPayment;
  }

  public async findAll(query: GetPaymentsQuery) {
    assertDatabaseConnection();

    const { page = 1, limit = 50, patientId, status, paymentMethod, search, timeRange } = query;
    const skip = (page - 1) * limit;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    if (isDbConnected()) {
      try {
        const filter: any = { isDeleted: false };
        if (patientId) filter.patientId = patientId;
        if (status && status !== 'All') filter.status = status;
        if (paymentMethod && paymentMethod !== 'All') filter.paymentMethod = paymentMethod;
        if (timeRange === 'today') {
          filter.date = todayStr;
        } else if (timeRange === 'week') {
          filter.date = { $gte: sevenDaysAgoStr };
        } else if (timeRange === 'month') {
          filter.date = { $gte: thirtyDaysAgoStr };
        }
        if (search) {
          filter.$or = [
            { patientName: { $regex: search, $options: 'i' } },
            { serviceName: { $regex: search, $options: 'i' } },
            { transactionId: { $regex: search, $options: 'i' } },
            { invoiceCode: { $regex: search, $options: 'i' } },
          ];
        }

        const [payments, total] = await Promise.all([
          PaymentModel.find(filter)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
          PaymentModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          payments,
          meta: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        };
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findAll payments failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      return {
        payments: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    let filtered = memoryStore.payments.filter((p) => !p.isDeleted);
    if (patientId) filtered = filtered.filter((p) => p.patientId === patientId);
    if (status && status !== 'All') filtered = filtered.filter((p) => p.status === status);
    if (paymentMethod && paymentMethod !== 'All') filtered = filtered.filter((p) => p.paymentMethod === paymentMethod);
    if (timeRange === 'today') {
      filtered = filtered.filter((p) => p.date === todayStr);
    } else if (timeRange === 'week') {
      filtered = filtered.filter((p) => p.date >= sevenDaysAgoStr);
    } else if (timeRange === 'month') {
      filtered = filtered.filter((p) => p.date >= thirtyDaysAgoStr);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.patientName.toLowerCase().includes(q) ||
          p.serviceName.toLowerCase().includes(q) ||
          (p.invoiceCode && p.invoiceCode.toLowerCase().includes(q)) ||
          (p.transactionId && p.transactionId.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const payments = filtered.slice(skip, skip + limit) as unknown as IPayment[];

    return {
      payments,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public async update(id: string, updateData: Partial<IPayment>): Promise<IPayment | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const payment = await PaymentModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: updateData },
          { returnDocument: 'after', runValidators: true }
        ).exec();
        if (payment) return payment;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update payment failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const payment = memoryStore.payments.find((p) => (p._id === id || p.id === id) && !p.isDeleted);
    if (!payment) return null;
    Object.assign(payment, updateData, { updatedAt: new Date() });
    return payment as unknown as IPayment;
  }

  public async softDelete(id: string): Promise<IPayment | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const payment = await PaymentModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: { isDeleted: true } },
          { returnDocument: 'after' }
        ).exec();
        if (payment) return payment;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose softDelete payment failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const payment = memoryStore.payments.find((p) => (p._id === id || p.id === id) && !p.isDeleted);
    if (!payment) return null;
    payment.isDeleted = true;
    payment.updatedAt = new Date();
    return payment as unknown as IPayment;
  }
}
