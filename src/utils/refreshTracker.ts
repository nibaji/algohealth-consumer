export interface RefreshFlags {
  family: boolean;
  records: boolean;
  profile: boolean;
}

class RefreshTracker {
  private flags: RefreshFlags = {
    family: false,
    records: false,
    profile: false,
  };

  setNeedsRefresh(key: keyof RefreshFlags, value: boolean): void {
    this.flags[key] = value;
  }

  getAndReset(key: keyof RefreshFlags): boolean {
    const value = this.flags[key];
    this.flags[key] = false;
    return value;
  }

  resetAll(): void {
    this.flags = {
      family: false,
      records: false,
      profile: false,
    };
  }
}

export const refreshTracker = new RefreshTracker();
