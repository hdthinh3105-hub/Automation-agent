import { Entity } from './entity.base';

export interface IDomainEvent {
  readonly occurredAt: Date;
  readonly eventName: string;
}

/**
 * Base class for Aggregate Roots. Collects Domain Events raised during
 * a use case so the Application layer can dispatch them (via
 * EventEmitter2) *after* the transaction commits successfully.
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: IDomainEvent[] = [];

  public get domainEvents(): ReadonlyArray<IDomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
