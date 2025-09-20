import { Module } from '@nestjs/common';
import { DealsModule } from './deals/deals.module';
import { ContactsModule } from './contacts/contacts.module';

@Module({
  imports: [DealsModule, ContactsModule],
  exports: [DealsModule, ContactsModule],
})
export class Bitrix24Module {}
