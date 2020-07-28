import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import LoginService from './login-service';

@Controller('/action/login')
export default class LoginController {
  @inject(LoginService) loginService: LoginService;

  @RequestMapping('/')
  dailyLogin(req: Request, res: Response): void {
    this.loginService.dailyLoginAll();
    res.status(200).send();
  }
}
