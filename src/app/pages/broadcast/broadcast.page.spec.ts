import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BroadcastPage } from './broadcast.page';

describe('BroadcastPage', () => {
  let component: BroadcastPage;
  let fixture: ComponentFixture<BroadcastPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BroadcastPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
