import { Archetype } from '../entities/Archetype.js';

/**
 * Repository interface for Archetype aggregate
 *
 * @description
 * Abstracts persistence layer — Mongo, PostgreSQL, etc.
 * All queries/commands on CharacterClass go through this interface.
 *
 * Port pattern: High-level domain doesn't know about Mongo/HTTP/etc.
 */
export interface IArchetypeRepository {
  /**
   * Retrieve all archetypes sorted by name
   */
  findAll(): Promise<Archetype[]>;

  /**
   * Retrieve an archetype by its unique name (id)
   * @throws NotFoundException if not found
   */
  findByName(name: string): Promise<Archetype | null>;

  /**
   * Retrieve an archetype by name, throw if not found
   * @throws NotFoundException
   */
  findByNameOrThrow(name: string): Promise<Archetype>;

  /**
   * Save or update an archetype
   */
  save(archetype: Archetype): Promise<Archetype>;

  /**
   * Delete an archetype by name
   */
  delete(name: string): Promise<void>;
}

export const IArchetypeRepository = Symbol('IArchetypeRepository');
