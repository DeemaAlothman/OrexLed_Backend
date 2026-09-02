import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QuoteRequestsModule } from './quote-requests/quote-requests.module';
import { RepresentativesModule } from './representatives/representatives.module';
import { ProjectsModule } from './projects/projects.module';
import { MaintenanceRequestsModule } from './maintenance-requests/maintenance-requests.module';
import { VideoGenerationsModule } from './video-generations/video-generations.module';
import { validateEnv } from './config/env.validation';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RepresentativesModule,
    QuoteRequestsModule,
    ProjectsModule,
    MaintenanceRequestsModule,
    VideoGenerationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
