import { Http } from '@angular/http';
import { Injectable } from '@angular/core';

const baseUrl = 'https://www.googleapis.com/youtube/v3';
const apiKey = 'AIzaSyASRfTPlzoDoP6TXe513o9b7N3mFwoOtQU';
const maxVideoResults = 50;
 
@Injectable()
export class VideoService {

	constructor(private http: Http) { }

	getIds(searchTerm: string, pageToken: string){
		return this.http.get(`${baseUrl}/search?q=${searchTerm}&pageToken=${pageToken}&type=video&part=id&maxResults=${maxVideoResults}&key=${apiKey}`)
			.map(response => response.json());
	}

	getDetails(ids: string){
		return this.http.get(`${baseUrl}/videos?id=${ids}&part=snippet,contentDetails&maxResults=${maxVideoResults}&key=${apiKey}`)
			.map(response => response.json());
	}

}
