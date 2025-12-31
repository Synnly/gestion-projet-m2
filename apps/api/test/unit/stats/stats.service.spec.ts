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

  // Setup: Start in-memory MongoDB, configure the testing module, and retrieve models
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

  // Teardown: Delete all documents from all collections after each test to ensure isolation
  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  // Teardown: Close connection and stop the server after all tests are done
  afterAll(async () => {
    await mongoConnection.close(); 
    await mongod.stop();
  });

  describe('getStats - KPI Globaux', () => {
    // Verify that the service correctly counts users, companies, and students
    it('should count total users and companies correctly', async () => {
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
  });

  describe('getStats - Taux de Réponse (Top Companies)', () => {
    // Verify that the response rate calculation is correct (e.g., 2 processed / 4 total = 50%)
    it('should calculate 50% response rate correctly', async () => {
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

    // Verify that the response rate is 0% when there are no applications (avoid division by zero)
    it('should return 0% response rate if no applications', async () => {
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
  });

  describe('getStats - Offres Orphelines', () => {
    // Verify that only posts with zero applications are counted as orphans
    it('should count only posts with 0 applications', async () => {
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
  });

  describe('getStats - Graphiques', () => {
    // Verify that the service returns empty arrays (instead of null/error) when the DB is empty
    it('should return empty arrays when no data exists', async () => {
      const stats = await service.getStats();
      
      expect(stats.applicationsByStatus).toEqual([]);
      expect(stats.applicationsOverTime).toEqual([]);
      expect(stats.topCompanies).toEqual([]);
    });
  });
});