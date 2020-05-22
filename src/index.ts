import * as discord from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();
const bumperBot = new discord.Client();

bumperBot.once('ready', () => {
  bumperBot.user?.setActivity(`les tryharders`, {
    type: 'LISTENING',
  });
  getMembersCount(bumperBot);
});

bumperBot.on('rateLimit', async () => {
  const server = bumperBot.guilds.resolve(process.env.GUILD_ID!);
  const commandsChannel = server?.channels.resolve(
    process.env.COMMANDS_CHANNEL_ID!
  );
  if (commandsChannel && commandsChannel instanceof discord.TextChannel) {
    commandsChannel.send(
      `Il semblerait qu'on ait fait sauter le rate limit les mecs, du coup il doit y avoir un bug quelque part, contactez mes devs svp.`
    );
  }
});

bumperBot.on('voiceStateUpdate', () => {
  getMembersCount(bumperBot);
});

bumperBot.on('presenceUpdate', (oldPresence, newPresence) => {
  if (
    newPresence.status === 'offline' ||
    (oldPresence && oldPresence.status === 'offline')
  ) {
    getMembersCount(bumperBot);
  }
});

bumperBot.on('message', (msg) => {
  if (!msg.guild) return; // no DM allowed

  /* 
    TO DO:
    - Handle countdown
    - Check on multi bumps
    - Clean code
  */

  if (msg.content.startsWith('test')) {
    msg.channel.send({
      embed: {
        title: 'BUMP',
        description: `Bump effectué les tryharders *Mpfmfmfmfpfffmpff* ${msg.author} 👍`,
      },
    });
  } else {
    if (
      msg.author.id === process.env.DISBOARD_BOT_ID &&
      msg.embeds.length > 0 &&
      msg.embeds[0].description?.match(/👍/)
    ) {
      const idMatching = msg.embeds[0].description.match(/[0-9]{18}/);
      if (idMatching) {
        const bumperId = idMatching[0];
        const bumper = msg.guild.members.resolve(bumperId);
        if (bumper) {
          const bumpingMessage = bumper.lastMessage;
          console.log(bumpingMessage?.mentions.members);
          if (
            bumpingMessage?.mentions.members &&
            bumpingMessage?.mentions.members.size > 0
          ) {
            const giftedMember = bumpingMessage?.mentions.members.first();
            handleBumperRole(giftedMember!, msg.guild);
          } else {
            handleBumperRole(bumper, msg.guild);
          }
        }
      }
    }
  }
});

async function handleBumperRole(
  bumper: discord.GuildMember,
  server: discord.Guild
) {
  const bumperRole = server.roles.cache.get(process.env.BUMPER_ROLE_ID!);
  const lastBumpers = bumperRole?.members.array();
  let newBumper = bumper;
  if (!lastBumpers?.includes(bumper)) {
    newBumper = await bumper.roles.add(process.env.BUMPER_ROLE_ID!);
  }

  lastBumpers
    ?.filter((previousBumper) => previousBumper.id !== newBumper.id)
    .forEach(async (previousBumper) => {
      await previousBumper.roles.remove(process.env.BUMPER_ROLE_ID!);
    });
}

function getMembersCount(bumperBot: discord.Client) {
  const server = bumperBot.guilds.resolve(process.env.GUILD_ID!);
  if (server) {
    let peopleInVoice = 0;
    const voiceChannels = server.channels.cache.filter(
      (channel) => channel.type === 'voice'
    );

    if (voiceChannels && voiceChannels.size > 0) {
      voiceChannels.each((channel) => {
        peopleInVoice += channel.members.size;
      });
    }

    const countingChannel = server.channels.cache.get(
      process.env.MEMBERS_COUNT_CHANNEL_ID!
    );
    if (countingChannel) {
      if (peopleInVoice < 1) {
        const peopleOnline = server.members.cache.filter(
          (member) => member.presence.status !== 'offline'
        ).size;
        const newName = `⚡ ${peopleOnline} membres en ligne`;
        if (countingChannel.name !== newName) {
          countingChannel.setName(newName);
        }
      } else {
        const newName = `📣 ${peopleInVoice} membres en vocal`;
        if (countingChannel.name !== newName) {
          countingChannel.setName(`📣 ${peopleInVoice} membres en vocal`);
        }
      }
    }
  }
}

bumperBot.login(process.env.TOKEN);
