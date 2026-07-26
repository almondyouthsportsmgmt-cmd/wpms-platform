import type {
  ResourceType,
  ScheduleResource,
} from "./schedulingTypes";

export interface ResourceSearchOptions {
  type?: ResourceType;
  activeOnly?: boolean;
}

class ResourceService {
  private resources: ScheduleResource[] = [];

  /**
   * Load all resources.
   * Later this will load from Supabase.
   */
  load(resources: ScheduleResource[]) {
    this.resources = [...resources];
  }

  /**
   * Returns every resource.
   */
  getAll(): ScheduleResource[] {
    return [...this.resources];
  }

  /**
   * Returns one resource.
   */
  get(id: string): ScheduleResource | undefined {
    return this.resources.find(
      (resource) => resource.id === id,
    );
  }

  /**
   * Returns all active resources.
   */
  getActive(): ScheduleResource[] {
    return this.resources.filter(
      (resource) => resource.active,
    );
  }

  /**
   * Returns resources by type.
   */
  getByType(
    type: ResourceType,
  ): ScheduleResource[] {
    return this.resources.filter(
      (resource) =>
        resource.type === type &&
        resource.active,
    );
  }

  /**
   * Flexible search.
   */
  search(
    options: ResourceSearchOptions = {},
  ): ScheduleResource[] {
    return this.resources.filter((resource) => {
      if (
        options.activeOnly &&
        !resource.active
      ) {
        return false;
      }

      if (
        options.type &&
        resource.type !== options.type
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Add resource.
   */
  add(
    resource: ScheduleResource,
  ) {
    this.resources.push(resource);
  }

  /**
   * Update resource.
   */
  update(
    resource: ScheduleResource,
  ) {
    this.resources = this.resources.map(
      (item) =>
        item.id === resource.id
          ? resource
          : item,
    );
  }

  /**
   * Remove resource.
   */
  remove(id: string) {
    this.resources =
      this.resources.filter(
        (resource) =>
          resource.id !== id,
      );
  }

  /**
   * Activate resource.
   */
  activate(id: string) {
    this.resources =
      this.resources.map((resource) =>
        resource.id === id
          ? {
              ...resource,
              active: true,
            }
          : resource,
      );
  }

  /**
   * Deactivate resource.
   */
  deactivate(id: string) {
    this.resources =
      this.resources.map((resource) =>
        resource.id === id
          ? {
              ...resource,
              active: false,
            }
          : resource,
      );
  }

  /**
   * Clear cache.
   */
  clear() {
    this.resources = [];
  }

  /**
   * Seed default resources for development.
   * These will eventually come from the database.
   */
  seedDefaults() {
    this.resources = [
      {
        id: "groomer-1",
        type: "groomer",
        name: "Primary Groomer",
        active: true,
      },
      {
        id: "table-1",
        type: "grooming-table",
        name: "Table 1",
        active: true,
      },
      {
        id: "kennel-1",
        type: "kennel",
        name: "Suite A1",
        active: true,
      },
    ];
  }
}

export const resourceService =
  new ResourceService();