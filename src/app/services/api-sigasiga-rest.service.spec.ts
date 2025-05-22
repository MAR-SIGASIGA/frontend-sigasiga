import { TestBed } from '@angular/core/testing';

import { ApiSigasigaRestService } from './api-sigasiga-rest.service';

describe('ApiSigasigaRestService', () => {
  let service: ApiSigasigaRestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiSigasigaRestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
