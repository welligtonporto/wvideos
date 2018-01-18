import { Component } from '@angular/core';
import { FormGroup, FormControl, FormControlDirective } from '@angular/forms';
import { VideoService } from './video.service';
import 'rxjs/Rx';
import 'rxjs/add/operator/debounceTime';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent {
    searchTerm = new FormControl();
    videosIdTemp: string[];
    allVideosFound: any[];
    videosForSelectTemp: any[];
    videosForWatch: any[];
    oldVideosForWatch: any[];
    maxDuration: number;
    oldMaxDuration: number;
    nextPageToken: string;
    videos: any[];
    maxResults: number = 200;
    resultsPerPage: number = 30;
    resultsEachJson: number = 50;
    timeToExpend;
    timeToExpendInSeconds: number[];
    daysToWatchAllVideos: number;
    idCurrentDayWeek: number;
    timeToWatchInTheDay: number;
    indexBeginningPagination: number = 0;
    indexEndPagination: number = this.resultsPerPage;
    showButtonPagination: boolean;

    constructor(private videoService: VideoService) { }

    getSearch(term){
        this.videos = [];
        this.videosIdTemp = [];
        this.allVideosFound = [];
        this.videosForSelectTemp = [];
        this.videosForWatch = [];
        this.nextPageToken = "";
        this.daysToWatchAllVideos = 0;
        this.showButtonPagination = false;

        if (term)
            this.getIds(term, "");
    }

    getIds(term: string, pageToken: string){
        this.videosIdTemp = [];
        this.videosForSelectTemp = [];

        this.videoService.getIds(term, pageToken)
            .subscribe(response => {
                response.items.map(item => {
                    this.videosIdTemp.push(item.id.videoId);
                });

                this.nextPageToken = response.nextPageToken;
                this.getDetails(this.videosIdTemp.join());
            });
    }

    getDetails(responseIds: string){
        this.videoService.getDetails(responseIds)
            .subscribe((response) => {
                response.items.map(item => {
                    let videoDurationInSeconds = this.convertIsoToSeconds(item.contentDetails.duration);
                    let thisItem = {
                        id: item.id,
                        duration: videoDurationInSeconds,
                        thumb: item.snippet.thumbnails.high.url,
                        title: item.snippet.title,
                        description: item.snippet.description
                    }

                    this.videosForSelectTemp.push(thisItem);
                    this.allVideosFound.push(thisItem);
                });

                this.selectVideosForWatch(this.videosForSelectTemp);
            });
    }

    selectVideosForWatch(videosForSelectTemp){
        videosForSelectTemp.map(item => {
            if (item.duration <= this.maxDuration){
                item.durationForShow = this.convertSecondsToHours(item.duration);
                this.videosForWatch.push(item);
            }
        });

        if (this.videosForWatch.length < this.maxResults && this.videosIdTemp.length == this.resultsEachJson)
            this.getIds(this.searchTerm.value, this.nextPageToken);
        else
            this.daysForWatch();

        if (this.videos.length < this.resultsPerPage) {
            this.videos = this.videosForWatch.slice(0,this.resultsPerPage);
            this.showButtonPagination = this.getPagination();
        }
    }

    getPagination(){
        if (this.videos.length < this.videosForWatch.slice(0,this.maxResults).length)
            return true;
        else
            return false;
    }

    getPage(){
        this.indexBeginningPagination += this.resultsPerPage;
        this.indexEndPagination += this.resultsPerPage;

        if (this.indexEndPagination > this.maxResults)
            this.indexEndPagination = this.maxResults;

        this.videos = this.videos.concat(this.videosForWatch.slice(this.indexBeginningPagination,this.indexEndPagination));
        this.showButtonPagination = this.getPagination();
    }

    daysForWatch(){
        this.daysToWatchAllVideos = 0;

        let actualDate = new Date();
        this.idCurrentDayWeek = actualDate.getDay();
        this.timeToWatchInTheDay = this.timeToExpendInSeconds[this.idCurrentDayWeek];

        this.videosForWatch.slice(0,this.maxResults).map(video => {
            this.watchVideos(video);
        });

        this.daysToWatchAllVideos++;
    }

    refreshDaysForWatch(newTimeToExpend){
        this.oldMaxDuration = this.maxDuration;
        this.maxDuration = this.calcMaxDuration(newTimeToExpend);
        
        if (this.searchTerm.value){
            if (this.maxDuration == this.oldMaxDuration){
                this.daysForWatch();
            } else if (this.maxDuration < this.oldMaxDuration) {
                this.oldVideosForWatch = this.videosForWatch;
                this.videosForWatch = [];

                this.selectVideosForWatch(this.oldVideosForWatch);
            } else {
                this.videosForWatch = [];
                this.selectVideosForWatch(this.allVideosFound);
            }
        }
    }

    watchVideos(videoToWatch){
        if (videoToWatch.duration <= this.timeToWatchInTheDay) {
            this.timeToWatchInTheDay -= videoToWatch.duration;
        } else {
            this.timeToWatchInTheDay = this.incrementCurrentDayWeek();
            this.daysToWatchAllVideos++;
            this.watchVideos(videoToWatch);
        }
    }

    incrementCurrentDayWeek(){
        this.idCurrentDayWeek++;

        if (this.idCurrentDayWeek == this.timeToExpendInSeconds.length)
            this.idCurrentDayWeek = 0; // back to sunday

        return this.timeToExpendInSeconds[this.idCurrentDayWeek];
    }

    calcMaxDuration(timeToExpend){
        this.timeToExpendInSeconds = Object.keys(timeToExpend).map(key => timeToExpend[key] * 60);
        return Math.max.apply(null, this.timeToExpendInSeconds);
    }

    convertIsoToSeconds(isoDuration){
        var reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
        var hours = 0, minutes = 0, seconds = 0, totalseconds;

        if (reptms.test(isoDuration)) {
            var matches = reptms.exec(isoDuration);
            if (matches[1]) hours = Number(matches[1]);
            if (matches[2]) minutes = Number(matches[2]);
            if (matches[3]) seconds = Number(matches[3]);
            totalseconds = hours * 3600  + minutes * 60 + seconds;
            return totalseconds;
        }
    }

    convertSecondsToHours(secondsDuration){
        let sec_num: any = parseInt(secondsDuration, 10);
        let hours: any   = Math.floor(sec_num / 3600);
        let minutes: any = Math.floor((sec_num - (hours * 3600)) / 60);
        let seconds: any = sec_num - (hours * 3600) - (minutes * 60);

        if (hours   < 10) hours   = "0"+hours;
        if (minutes < 10) minutes = "0"+minutes;
        if (seconds < 10) seconds = "0"+seconds;

        if (hours != "00")
            return hours+':'+minutes+':'+seconds;
        else
            return minutes+':'+seconds;
    }

    ngOnInit() {
        const defaultTimeToExpend = 60;

        this.timeToExpend = new FormGroup({
            sunday: new FormControl(defaultTimeToExpend),
            monday: new FormControl(defaultTimeToExpend),
            tuesday: new FormControl(defaultTimeToExpend),
            wednesday: new FormControl(defaultTimeToExpend),
            thursday: new FormControl(defaultTimeToExpend),
            friday: new FormControl(defaultTimeToExpend),
            saturday: new FormControl(defaultTimeToExpend),
        });

        this.searchTerm.valueChanges
            .debounceTime(1000)
            .subscribe(newValue => this.getSearch(newValue));

        this.timeToExpend.valueChanges
            .debounceTime(1000)
            .subscribe(values => this.refreshDaysForWatch(values));

        this.maxDuration = this.calcMaxDuration(this.timeToExpend.value);

        this.daysToWatchAllVideos = 0;
    }
}
