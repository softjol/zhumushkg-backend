import { Controller, Delete, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { RefId } from 'src/decorators/ref.decorator';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private logger: CustomLogger,
  ) {}

  @Delete(':id')
  async removeById(@Param('id') id: number, @RefId() refId: string) {
    this.logger.debug(`[CONTROLLER] remove user by id ${id}`, refId);

    try {
      const user = await this.userService.findOneById(id, refId);

      if (!user) {
        this.logger.debug(`[CONTROLLER] User with id ${id} not found`, refId);
        return { message: `User with id ${id} not found` };
      }

      await this.userService.removeById(id, refId);
      this.logger.debug(
        `[CONTROLLER] User with id ${id} removed successfully`,
        refId,
      );
      return { message: `Пользователь с id ${id} удален успешно` };
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] Error occurred while removing user by id ${id}`,
        refId,
      );
      throw error;
    }
  }
}
