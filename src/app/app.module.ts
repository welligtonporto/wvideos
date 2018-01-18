import { BrowserModule }  from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { VideoService } from './video.service';
import { AppComponent } from './app.component'

@NgModule({
  imports: [BrowserModule, 
    ReactiveFormsModule, 
    FormsModule, 
    HttpModule],
  providers: [VideoService],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {

}