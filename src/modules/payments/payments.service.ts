import { PaymentRepository } from './payments.repository';
import { PatientRepository } from '../patients/patients.repository';
import { CreatePaymentInput, UpdatePaymentInput, GetPaymentsQuery } from './payments.validation';
import { NotFoundError } from '../../shared/errors/app-error';
import { logActivity, ActivityActor } from '../../shared/utils/activity-logger';

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private patientRepository: PatientRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.patientRepository = new PatientRepository();
  }

  public async createPayment(input: CreatePaymentInput, actor?: ActivityActor) {
    let patientName = input.patientName;
    if (input.patientId) {
      const patient = await this.patientRepository.findById(input.patientId);
      if (patient) patientName = patient.name;
    }

    const finalAmount = Number(input.amount || input.totalAmount || 0);
    const serviceName = input.serviceName || input.serviceType || input.description || 'Medical Consultation';
    const date = input.date || new Date().toISOString().split('T')[0];
    const dueDate = input.dueDate || date;
    const invoiceNo = input.invoiceNo || input.invoiceNumber || `INV-${Date.now()}`;

    const payment: any = await this.paymentRepository.create({
      id: input.id,
      invoiceCode: invoiceNo,
      patientId: input.patientId,
      patientName,
      appointmentId: input.appointmentId,
      serviceName,
      amount: finalAmount,
      paidAmount: input.paidAmount !== undefined ? Number(input.paidAmount) : undefined,
      status: (input.status as any) || 'Pending',
      date,
      dueDate,
      paymentMethod: input.paymentMethod || 'Credit Card',
      insuranceProvider: input.insuranceProvider || '',
      claimId: input.claimId || '',
      partialReason: input.partialReason || '',
      nextPaymentDate: input.nextPaymentDate || '',
      transactionId: input.transactionId || `TXN-${Date.now()}`,
    } as any);

    const result = typeof payment?.toJSON === 'function' ? payment.toJSON() : payment;
    await logActivity(actor, 'created', 'Payment', `$${finalAmount} for ${patientName} (${invoiceNo})`);
    return result;
  }

  public async getPayments(query: GetPaymentsQuery) {
    const result = await this.paymentRepository.findAll(query);
    return {
      payments: result.payments.map((p: any) => (typeof p?.toJSON === 'function' ? p.toJSON() : p)),
      meta: result.meta,
    };
  }

  public async getPaymentById(id: string) {
    const payment: any = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundError('Payment record not found.');
    }
    return typeof payment?.toJSON === 'function' ? payment.toJSON() : payment;
  }

  public async updatePayment(id: string, input: UpdatePaymentInput, actor?: ActivityActor) {
    const payment: any = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundError('Payment record not found.');
    }

    const updatePayload: any = { ...input };
    if (input.serviceType && !input.serviceName) {
      updatePayload.serviceName = input.serviceType;
    }
    if (input.totalAmount && !input.amount) {
      updatePayload.amount = input.totalAmount;
    }

    const updatedPayment: any = await this.paymentRepository.update(id, updatePayload);
    const result = typeof updatedPayment?.toJSON === 'function' ? updatedPayment.toJSON() : updatedPayment;
    await logActivity(actor, 'updated', 'Payment', `${payment.patientName} (${id})`);
    return result;
  }

  public async deletePayment(id: string, actor?: ActivityActor) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundError('Payment record not found.');
    }

    await this.paymentRepository.softDelete(id);
    await logActivity(actor, 'deleted', 'Payment', `${payment.patientName} (${id})`);
  }
}
