import { Telegraf } from 'telegraf';
import { User } from '../models';
import { config } from '../config';

export interface ChannelConfig {
  channelId: string;
  messageId?: number;
}

// Читать конфиг канала
export function getChannelConfig(): ChannelConfig {
  const channelId = (process.env.CHANNEL_ID || config.channelId || '').toString();
  const messageId = process.env.CHANNEL_MESSAGE_ID 
    ? parseInt(process.env.CHANNEL_MESSAGE_ID) 
    : undefined;
  
  return { channelId, messageId };
}

// Сохранить ID сообщения (в env или конфиге)
export function saveChannelMessageId(messageId: number): void {
  process.env.CHANNEL_MESSAGE_ID = messageId.toString();
  console.log(`✅ Saved channel message ID: ${messageId}`);
}

// Отправить начальное сообщение в канал
export async function postGameMessage(bot: Telegraf): Promise<number | null> {
  try {
    const { channelId } = getChannelConfig();
    
    if (!channelId) {
      console.warn('⚠️ CHANNEL_ID not configured');
      return null;
    }

    const playerCount = await User.count();
    
    const message = 
      `🎮 **INVEST BOT - Браузерная игра об инвестициях**\n\n` +
      `👥 Активных игроков: ${playerCount}\n\n` +
      `💰 Начните зарабатывать деньги прямо сейчас!\n` +
      `🏪 Покупайте активы\n` +
      `📈 Развивайте бизнес\n` +
      `💎 Становитесь миллиардером\n\n` +
      `_Нажмите кнопку ниже для начала_`;

    // Отправить сообщение в канал
    const sentMessage = await bot.telegram.sendMessage(
      channelId,
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '▶️ Начать игру',
                url: 'https://t.me/dashininvestgamebot'
              }
            ]
          ]
        }
      }
    );

    // Сохранить ID сообщения
    saveChannelMessageId(sentMessage.message_id);
    console.log(`✅ Posted game message to channel. Message ID: ${sentMessage.message_id}`);
    
    return sentMessage.message_id;
  } catch (error) {
    console.error('❌ Error posting game message:', error);
    return null;
  }
}

// Обновить сообщение в канале
export async function updateGameMessage(bot: Telegraf): Promise<boolean> {
  try {
    const { channelId, messageId } = getChannelConfig();
    
    if (!channelId || !messageId) {
      console.warn('⚠️ Channel ID or Message ID not configured');
      return false;
    }

    const playerCount = await User.count();
    
    const message = 
      `🎮 **INVEST BOT - Браузерная игра об инвестициях**\n\n` +
      `👥 Активных игроков: ${playerCount}\n\n` +
      `💰 Начните зарабатывать деньги прямо сейчас!\n` +
      `🏪 Покупайте активы\n` +
      `📈 Развивайте бизнес\n` +
      `💎 Становитесь миллиардером\n\n` +
      `_Нажмите кнопку ниже для начала_`;

    // Обновить сообщение в канале
    await bot.telegram.editMessageText(
      channelId,
      messageId,
      undefined,
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '▶️ Начать игру',
                url: 'https://t.me/dashininvestgamebot'
              }
            ]
          ]
        }
      }
    );

    console.log(`✅ Updated game message in channel`);
    return true;
  } catch (error) {
    console.error('❌ Error updating game message:', error);
    return false;
  }
}

// Регистрировать обработчик нажатия кнопки в канале
export function registerChannelHandlers(bot: Telegraf) {
  // Кнопка теперь использует URL вместо callback, 
  // поэтому этот обработчик больше не нужен
  // Пользователь просто откроет чат с ботом через кнопку
}
