import { executeConcurrent, makeMobileRequest, NOBOT_MOBILE_URL, Service, tokenManager } from '@nobot-core/commons';
import { SkillRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';

@Service()
export default class SkillScanService {
  private logger = getLogger(SkillScanService.name);

  private skillRepository: SkillRepository;

  constructor(connection: Connection) {
    this.skillRepository = connection.getCustomRepository(SkillRepository);
  }

  scan = async (): Promise<void> => {
    const skills = await this.skillRepository.find({ select: ['id'] });
    const scanSkillIds = [];
    for (let i = 1; i < 2150; i++) {
      if (!skills.find((s) => s.id === i)) {
        scanSkillIds.push(i);
      }
    }
    await tokenManager.getToken('zz0071');
    await executeConcurrent(
      scanSkillIds,
      async (skillId: number) => {
        await this.scanSkill(skillId, 'zz0071', 44907806);
      },
      10
    );
  };

  scanSkill = async (skillId: number, login: string, cardId: number): Promise<void> => {
    this.logger.info('Scan skill %d.', skillId);
    const page = await makeMobileRequest(
      encodeURIComponent(`${NOBOT_MOBILE_URL.SKILL_CONFIRM}?unique_id=${cardId}&skill_id=${skillId}`),
      login
    );
    if (page('#view-card').length > 0) {
      try {
        // skill infos are before this div
        const divMark = page('form').first().parents('table').parents('div');
        const divSkill = divMark.prevAll('div').first();
        const fonts = divSkill.find('font');
        this.logger.info('Create skill %d.', skillId);
        await this.skillRepository.save({
          id: skillId,
          name: fonts.eq(0)[0].nextSibling.nodeValue,
          property: fonts.eq(1)[0].nextSibling.nodeValue,
          type: fonts.eq(2)[0].nextSibling.nodeValue,
          level: parseInt(fonts.eq(3)[0].nextSibling.nodeValue, 10),
          weight: parseInt(fonts.eq(4)[0].nextSibling.nodeValue, 10),
          target: fonts.eq(5)[0] ? fonts.eq(5)[0].nextSibling.nodeValue : null,
          effect: divSkill.next().next()[0].nextSibling.nodeValue
        });
      } catch (err) {
        this.logger.error('Error while scan skill %d.', skillId);
        this.logger.error(err);
      }
    } else {
      this.logger.info('Skill %d does not exist.', skillId);
    }
  };
}
