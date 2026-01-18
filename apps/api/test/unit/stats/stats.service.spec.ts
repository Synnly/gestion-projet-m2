import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model, Types } from 'mongoose';
import { StatsService } from '../../../src/stats/stats.service';

import { User, UserSchema } from '../../../src/user/user.schema';
import { Company, CompanySchema } from '../../../src/company/company.schema';
import { Student, StudentSchema } from '../../../src/student/student.schema';
import { Application, ApplicationSchema } from '../../../src/application/application.schema';
import { Post, PostSchema, PostType } from '../../../src/post/post.schema';

describe('StatsService (Integration)', () => {
  let service: StatsService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  let companyModel: Model<Company>;
  let postModel: Model<Post>;
  let applicationModel: Model<Application>;
  let userModel: Model<User>;
  let studentModel: Model<Student>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { 
            name: User.name, 
            schema: UserSchema,
            discriminators: [
              { name: Company.name, schema: CompanySchema },
              { name: Student.name, schema: StudentSchema },
            ],
          },
          { name: Post.name, schema: PostSchema },
          { name: Application.name, schema: ApplicationSchema },
        ]),
      ],
      providers: [StatsService],
    }).compile();

    service = module.get<StatsService>(StatsService);
    mongoConnection = module.get<Connection>(getConnectionToken());

    companyModel = module.get<Model<Company>>(getModelToken(Company.name));
    postModel = module.get<Model<Post>>(getModelToken(Post.name));
    applicationModel = module.get<Model<Application>>(getModelToken(Application.name));
    userModel = module.get<Model<User>>(getModelToken(User.name));
    studentModel = module.get<Model<Student>>(getModelToken(Student.name));
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoConnection.close(); 
    await mongod.stop();
  });

  describe('getStats', () => {

    // Scénario 1 : KPI Globaux
    it('should count total users, companies and students correctly', async () => {
      await companyModel.create({ 
          email: 'comp@test.com', password: 'pwd', 
          name: 'Test Corp', siretNumber: '123' 
      });

      await studentModel.create({ 
          email: 'stud@test.com', password: 'pwd',
          firstName: 'John', lastName: 'Doe', studentNumber: 'S1' 
      });

      await studentModel.create({ 
          email: 'other@test.com', password: 'pwd',
          firstName: 'Jane', lastName: 'Doe', studentNumber: 'S2'
      });

      const stats = await service.getStats();

      expect(stats.totalUsers).toBe(3);      
      expect(stats.totalCompanies).toBe(1); 
      expect(stats.totalStudents).toBe(2);   
    });

    // Scénario 2 : Top Companies & Taux de réponse
    it('should calculate 50% response rate for top companies', async () => {
      const company = await companyModel.create({
          email: 'response@test.com', password: 'pwd',
          name: 'Reponse SAS', siretNumber: '999'
      });

      const post = await postModel.create({
          title: 'Dev NestJS', description: 'Desc', company: company._id, type: PostType.Teletravail
      });

      const dummyStudentId = new Types.ObjectId(); 

      await applicationModel.create([
          { post: post._id, status: 'Accepted', student: dummyStudentId, cv: 'http://cv1.pdf' },
          { post: post._id, status: 'Rejected', student: dummyStudentId, cv: 'http://cv2.pdf' },
          { post: post._id, status: 'Pending', student: dummyStudentId, cv: 'http://cv3.pdf' },
          { post: post._id, status: 'Pending', student: dummyStudentId, cv: 'http://cv4.pdf' }
      ]);

      const stats = await service.getStats();
      const targetCompany = stats.topCompanies.find(c => c.name === 'Reponse SAS');

      expect(targetCompany).toBeDefined();
      expect(targetCompany.offersCount).toBe(1);
      expect(targetCompany.responseRate).toBe(50);
    });

    // Scénario 3 : Division par zéro
    it('should return 0% response rate if no applications exist', async () => {
      const company = await companyModel.create({
          email: 'zero@test.com', password: 'pwd',
          name: 'Zero Corp', siretNumber: '888'
      });
      await postModel.create({
          title: 'Vide', description: 'Desc', company: company._id, type: PostType.Presentiel
      });

      const stats = await service.getStats();
      const targetCompany = stats.topCompanies.find(c => c.name === 'Zero Corp');

      expect(targetCompany.responseRate).toBe(0);
    });

    // Scénario 4 : Offres orphelines
    it('should count only posts with 0 applications as orphans', async () => {
      const company = await companyModel.create({
          email: 'orphan@test.com', password: 'pwd', name: 'Orphan Corp'
      });

      const postWithApp = await postModel.create({ 
          title: 'Full', description: '...', company: company._id, type: PostType.Presentiel 
      });
      
      const dummyStudentId = new Types.ObjectId();
      await applicationModel.create({ 
          post: postWithApp._id, 
          status: 'Pending', 
          student: dummyStudentId, cv: 'http://cv.pdf' 
      });

      await postModel.create({ 
          title: 'Empty', description: '...', company: company._id, type: PostType.Presentiel 
      });

      const stats = await service.getStats();
      
      expect(stats.orphanOffersCount).toBe(1);
    });

    // Scénario 5 : Tableaux vides
    it('should return empty arrays when no data exists', async () => {
      const stats = await service.getStats();
      
      expect(stats.applicationsByStatus).toEqual([]);
      expect(stats.applicationsOverTime).toEqual([]);
      expect(stats.topCompanies).toEqual([]);
    });

    // Scénario 6 : Filtre des 6 mois 
    it('should ignore applications older than 6 months in timeline chart', async () => {
        const today = new Date();
        const sevenMonthsAgo = new Date();
        sevenMonthsAgo.setMonth(today.getMonth() - 7);
  
        const company = await companyModel.create({ email: 'date@test.com', password: 'p', name: 'Date Corp' });
        
        const post = await postModel.create({ 
            title: 'Date Post', 
            description: 'Description requise', 
            company: company._id, 
            type: PostType.Teletravail 
        });
        
        const studentId = new Types.ObjectId();
  
        await applicationModel.create({ 
            post: post._id, student: studentId, status: 'Pending', cv: 'cv.pdf',
            createdAt: today 
        });
  
        const oldApp = new applicationModel({ 
            post: post._id, student: studentId, status: 'Pending', cv: 'cv.pdf' 
        });
        oldApp.createdAt = sevenMonthsAgo;
        await oldApp.save();
  
        const stats = await service.getStats();
  
        expect(stats.totalApplications).toBe(2);
  
        const totalInChart = stats.applicationsOverTime.reduce((acc, val) => acc + (val.count || 0), 0);
        expect(totalInChart).toBe(1);
    });
  });
});