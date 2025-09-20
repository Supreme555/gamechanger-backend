import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContactsService } from './services/contacts.service';

@Module({
  imports: [ConfigModule],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
