/**
 * Extension du modèle BadgeRequest pour inclure le type PROGRESSION
 * TODO: À supprimer une fois que le modèle OpenAPI généré inclura PROGRESSION
 */
import { BadgeRequest } from './badgeRequest';

export type BadgeRequestType = BadgeRequest['type'] | 'PROGRESSION';

export interface BadgeRequestExtended extends Omit<BadgeRequest, 'type'> {
  type: BadgeRequestType;
}

