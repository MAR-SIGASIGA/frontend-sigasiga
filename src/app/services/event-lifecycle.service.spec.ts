import { TestBed } from '@angular/core/testing';

import { EventLifecycleService } from './event-lifecycle.service';

describe('EventLifecycleService', () => {
  let service: EventLifecycleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventLifecycleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
