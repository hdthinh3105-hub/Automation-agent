/**
 * Minimal write-repository contract. Modules define their own richer
 * interfaces (e.g. IUserRepository) that extend this where useful —
 * this is here mainly to keep a consistent shape across the codebase
 * (Interface Segregation: read/write repos are kept separate).
 */
export interface IWriteRepository<TEntity, TId> {
  save(entity: TEntity): Promise<void>;
  findById(id: TId): Promise<TEntity | null>;
}

export interface IReadRepository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
}
