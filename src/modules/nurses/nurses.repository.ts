import mongoose from 'mongoose';
import { NurseModel, INurse } from './models/nurse.model';
import { GetNursesQuery } from './nurses.validation';
import { assertDatabaseConnection, isDemoModeEnabled, isDbConnected } from '../../shared/database/db-guard';

export class NurseRepository {
  public async create(nurseData: Partial<INurse>): Promise<INurse> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await NurseModel.create(nurseData);
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose create nurse failed:', err);
      }
    }

    const newNurse: any = {
      _id: `nurse-${Date.now()}`,
      id: `nurse-${Date.now()}`,
      name: nurseData.name || 'Staff Nurse',
      email: nurseData.email || 'nurse@prms.hospital',
      phone: nurseData.phone || '+1 (555) 000-0000',
      avatar: nurseData.avatar || '',
      department: nurseData.department || 'ICU',
      shift: nurseData.shift || 'Morning',
      licenseNumber: nurseData.licenseNumber || `RN-${Date.now()}`,
      assignedWard: nurseData.assignedWard || 'Ward 1',
      status: nurseData.status || 'Active',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newNurse;
  }

  public async findById(id: string): Promise<INurse | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const nurse = await NurseModel.findOne({ _id: id, isDeleted: false }).populate('userId', 'name email role avatar status').exec();
        if (nurse) return nurse;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findById nurse failed:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    return {
      _id: id,
      id: id,
      name: 'Nurse Clara Oswald',
      email: 'clara.oswald@prms.hospital',
      phone: '+1 (555) 482-9910',
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80',
      department: 'Intensive Care Unit (ICU)',
      shift: 'Morning',
      licenseNumber: 'RN-88310-ICU',
      assignedWard: 'ICU Ward 3B - Bed 04',
      status: 'Active',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as INurse;
  }

  public async findByLicenseNumber(licenseNumber: string): Promise<INurse | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await NurseModel.findOne({ licenseNumber, isDeleted: false }).exec();
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findByLicenseNumber failed:', err);
      }
    }
    return null;
  }

  public async findAll(query: GetNursesQuery) {
    assertDatabaseConnection();

    const { page = 1, limit = 50, department, shift, status, search } = query;
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      try {
        const filter: any = { isDeleted: false };
        if (department) filter.department = department;
        if (shift) filter.shift = shift;
        if (status) filter.status = status;
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { assignedWard: { $regex: search, $options: 'i' } },
          ];
        }

        const [nurses, total] = await Promise.all([
          NurseModel.find(filter)
            .populate('userId', 'name email role avatar status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
          NurseModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          nurses,
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
        console.warn('⚠️ Mongoose findAll nurses failed, using fallback:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      return {
        nurses: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const defaultNurses = [
      {
        _id: 'nurse-1',
        id: 'nurse-1',
        name: 'Priya Sharma, BSN, RN',
        email: 'priya.sharma@meridianhealth.org',
        phone: '+1 (555) 321-7890',
        address: '742 Evergreen Terrace, Springfield, OR 97477',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=200',
        department: 'Intensive Care Unit (ICU)',
        shift: 'Morning',
        licenseNumber: 'RN-88310-ICU',
        assignedWard: 'ICU Unit 4, Bed 1-6',
        patientLoad: 4,
        assignedPatientIds: ['p-1', 'p-8'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-2',
        id: 'nurse-2',
        name: 'Markus Vance, BSN',
        email: 'markus.vance@meridianhealth.org',
        phone: '+1 (555) 321-7891',
        address: '10880 Wilshire Blvd, Los Angeles, CA 90024',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        department: 'General Surgery',
        shift: 'Morning',
        licenseNumber: 'RN-902-SRG',
        assignedWard: 'Surgical Floor 3',
        patientLoad: 5,
        assignedPatientIds: ['p-7', 'p-16'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-3',
        id: 'nurse-3',
        name: 'Elena Rostova, MSN',
        email: 'elena.rostova@meridianhealth.org',
        phone: '+1 (555) 321-7892',
        address: '450 Sutter St, San Francisco, CA 94108',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
        department: 'Cardiology',
        shift: 'Evening',
        licenseNumber: 'RN-903-CARD',
        assignedWard: 'Cardiac Care Unit (CCU)',
        patientLoad: 4,
        assignedPatientIds: ['p-1', 'p-20'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-4',
        id: 'nurse-4',
        name: 'Jamal Washington, RN',
        email: 'jamal.w@meridianhealth.org',
        phone: '+1 (555) 321-7893',
        address: '525 E 68th St, New York, NY 10065',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        department: 'Emergency',
        shift: 'Night',
        licenseNumber: 'RN-904-EMR',
        assignedWard: 'ER Trauma Bays 1-4',
        patientLoad: 6,
        assignedPatientIds: ['p-8', 'p-17'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-5',
        id: 'nurse-5',
        name: 'Sofia Gomez, BSN',
        email: 'sofia.gomez@meridianhealth.org',
        phone: '+1 (555) 321-7894',
        address: '2200 E 42nd Ave, Denver, CO 80216',
        avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200',
        department: 'Pediatrics',
        shift: 'Morning',
        licenseNumber: 'RN-905-PED',
        assignedWard: 'Pediatrics Ward 2B',
        patientLoad: 4,
        assignedPatientIds: ['p-4'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-6',
        id: 'nurse-6',
        name: 'David Chen, RN',
        email: 'david.chen@meridianhealth.org',
        phone: '+1 (555) 321-7895',
        address: '333 Cedar St, New Haven, CT 06510',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        department: 'Neurology',
        shift: 'Morning',
        licenseNumber: 'RN-906-NEU',
        assignedWard: 'Neuro-Care Unit 4',
        patientLoad: 3,
        assignedPatientIds: ['p-9', 'p-19'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-7',
        id: 'nurse-7',
        name: 'Amina Al-Mansoor, BSN',
        email: 'amina.almansoor@meridianhealth.org',
        phone: '+1 (555) 321-7896',
        address: '757 Westwood Plaza, Los Angeles, CA 90095',
        avatar: 'https://images.unsplash.com/photo-1594824813566-88855ce7890f?auto=format&fit=crop&q=80&w=200',
        department: 'Dermatology',
        shift: 'Morning',
        licenseNumber: 'RN-907-DERM',
        assignedWard: 'Dermatology Day Care',
        patientLoad: 3,
        assignedPatientIds: ['p-6', 'p-18'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-8',
        id: 'nurse-8',
        name: 'Lucas Dupont, RN',
        email: 'lucas.dupont@meridianhealth.org',
        phone: '+1 (555) 321-7897',
        address: '200 First St SW, Rochester, MN 55905',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        department: 'Orthopedics',
        shift: 'Evening',
        licenseNumber: 'RN-908-ORT',
        assignedWard: 'Orthopedic Post-Op Ward',
        patientLoad: 5,
        assignedPatientIds: ['p-5'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-9',
        id: 'nurse-9',
        name: 'Hannah Abbott, MSN',
        email: 'hannah.abbott@meridianhealth.org',
        phone: '+1 (555) 321-7898',
        address: '600 N Wolfe St, Baltimore, MD 21287',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        department: 'General Medicine',
        shift: 'Morning',
        licenseNumber: 'RN-909-MED',
        assignedWard: 'General Ward 5A',
        patientLoad: 6,
        assignedPatientIds: ['p-3', 'p-15'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-10',
        id: 'nurse-10',
        name: 'Chloe Dubois, BSN',
        email: 'chloe.dubois@meridianhealth.org',
        phone: '+1 (555) 321-7899',
        address: '300 Longwood Ave, Boston, MA 02115',
        avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=200',
        department: 'Psychiatry',
        shift: 'Morning',
        licenseNumber: 'RN-910-PSY',
        assignedWard: 'Behavioral Health Unit',
        patientLoad: 3,
        assignedPatientIds: ['p-2'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-11',
        id: 'nurse-11',
        name: 'Rachel Green, RN',
        email: 'rachel.green@meridianhealth.org',
        phone: '+1 (555) 321-7900',
        address: '11100 Euclid Ave, Cleveland, OH 44106',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
        department: 'Emergency',
        shift: 'Night',
        licenseNumber: 'RN-911-EMR',
        assignedWard: 'ER Bay 3-6',
        patientLoad: 5,
        assignedPatientIds: ['p-8'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-12',
        id: 'nurse-12',
        name: 'Oliver Queen, BSN',
        email: 'oliver.queen@meridianhealth.org',
        phone: '+1 (555) 321-7901',
        address: '1600 Divisadero St, San Francisco, CA 94115',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
        department: 'Cardiology',
        shift: 'Morning',
        licenseNumber: 'RN-912-CARD',
        assignedWard: 'Cardiac Telemetry Bay',
        patientLoad: 4,
        assignedPatientIds: ['p-1'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-13',
        id: 'nurse-13',
        name: 'Maya Lin, MSN',
        email: 'maya.lin@meridianhealth.org',
        phone: '+1 (555) 321-7902',
        address: '550 1st Ave, New York, NY 10016',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
        department: 'General Surgery',
        shift: 'Evening',
        licenseNumber: 'RN-913-SRG',
        assignedWard: 'Post-Op Recovery Room',
        patientLoad: 4,
        assignedPatientIds: ['p-7'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-14',
        id: 'nurse-14',
        name: 'Ethan Hunt, RN',
        email: 'ethan.hunt@meridianhealth.org',
        phone: '+1 (555) 321-7903',
        address: '200 Lothrop St, Pittsburgh, PA 15213',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
        department: 'Intensive Care Unit (ICU)',
        shift: 'Night',
        licenseNumber: 'RN-914-ICU',
        assignedWard: 'ICU Step-down Unit',
        patientLoad: 3,
        assignedPatientIds: ['p-1'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-15',
        id: 'nurse-15',
        name: 'Zoe Saldana, BSN',
        email: 'zoe.saldana@meridianhealth.org',
        phone: '+1 (555) 321-7904',
        address: '900 E Monument St, Baltimore, MD 21205',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
        department: 'Pediatrics',
        shift: 'Morning',
        licenseNumber: 'RN-915-PED',
        assignedWard: 'Pediatric Acute Bay',
        patientLoad: 4,
        assignedPatientIds: ['p-4'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-16',
        id: 'nurse-16',
        name: 'Vikram Seth, RN',
        email: 'vikram.seth.rn@meridianhealth.org',
        phone: '+1 (555) 321-7905',
        address: '1500 E Duarte Rd, Duarte, CA 91010',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
        department: 'Emergency',
        shift: 'Evening',
        licenseNumber: 'RN-916-EMR',
        assignedWard: 'ER Bay 1-2',
        patientLoad: 5,
        assignedPatientIds: ['p-17'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-17',
        id: 'nurse-17',
        name: 'Naomi Campbell, MSN',
        email: 'naomi.campbell@meridianhealth.org',
        phone: '+1 (555) 321-7906',
        address: '1211 Medical Center Dr, Nashville, TN 37232',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
        department: 'Orthopedics',
        shift: 'Morning',
        licenseNumber: 'RN-917-ORT',
        assignedWard: 'Joint Rehab Suite',
        patientLoad: 4,
        assignedPatientIds: ['p-5'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'nurse-18',
        id: 'nurse-18',
        name: 'Claire Temple, BSN, RN',
        email: 'claire.temple@meridianhealth.org',
        phone: '+1 (555) 321-7907',
        address: '1000 10th Ave, New York, NY 10019',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=200',
        department: 'General Medicine',
        shift: 'Morning',
        licenseNumber: 'RN-918-MED',
        assignedWard: 'General Ward 2A',
        patientLoad: 5,
        assignedPatientIds: ['p-3'],
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    let filtered = defaultNurses;
    if (department) filtered = filtered.filter((n) => n.department.toLowerCase().includes(department.toLowerCase()));
    if (shift) filtered = filtered.filter((n) => n.shift.toLowerCase().includes(shift.toLowerCase()));
    if (status) filtered = filtered.filter((n) => n.status.toLowerCase() === status.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.email.toLowerCase().includes(q) ||
          n.department.toLowerCase().includes(q) ||
          n.assignedWard.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice(skip, skip + limit);

    return {
      nurses: paginated as unknown as INurse[],
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

  public async update(id: string, updateData: Partial<INurse>): Promise<INurse | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await NurseModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: updateData },
          { returnDocument: 'after', runValidators: true }
        ).exec();
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update nurse failed:', err);
      }
    }
    return null;
  }

  public async softDelete(id: string): Promise<INurse | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await NurseModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: { isDeleted: true, status: 'Inactive' } },
          { returnDocument: 'after' }
        ).exec();
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose softDelete nurse failed:', err);
      }
    }
    return null;
  }
}

