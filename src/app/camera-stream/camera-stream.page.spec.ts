import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CameraStreamPage } from './camera-stream.page';

describe('CameraStreamPage', () => {
  let component: CameraStreamPage;
  let fixture: ComponentFixture<CameraStreamPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CameraStreamPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
