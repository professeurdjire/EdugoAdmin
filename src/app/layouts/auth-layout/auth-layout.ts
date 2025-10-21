import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Login} from '../../pages/auth/login/login';
import {Register} from '../../pages/auth/register/register';

@Component({
  selector: 'app-auth-layout',
  standalone:true,
  imports: [RouterOutlet],
  templateUrl: './auth-layout.html',
  styleUrls: ['./auth-layout.css'],
})
export class AuthLayout {

}
