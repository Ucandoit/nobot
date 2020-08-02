import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import LoginService from './login-service';

@Controller('/action/login')
export default class LoginController {
  @inject(LoginService) loginService: LoginService;

  @RequestMapping('/')
  dailyLoginAll(req: Request, res: Response): void {
    this.loginService.dailyLoginAll();
    res.status(200).send();
  }

  @RequestMapping('/:login')
  async dailyLogin(req: Request, res: Response): Promise<void> {
    const { login } = req.params;
    await this.loginService.dailyLogin(login);
    res.status(200).send();
  }
}
