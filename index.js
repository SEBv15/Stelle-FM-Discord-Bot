const Discord = require('discord.js');
const client = new Discord.Client();
const token = require("./token.json").token;
var Through = require('audio-through');
var internetradio = require('node-internet-radio');
var events = require('events');
var ee = new events.EventEmitter();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({ status: 'online', game: { name: "+help" } });
});

var awaitingConfirm = {}
var footerText = "© Sebastian Strempfer | +help, +play/+stelle, +stop, +cam, +info";

client.on('message', msg => {
    msg.content = msg.content.toLowerCase().trim();
    if (msg.content === '+stelle' || msg.content === "+play") {
        if(msg.guild.voiceConnection && !awaitingConfirm[msg.author.id]) {
            sendEmbed(msg, {
                embed: {
                    color: 16744512,
                    author: {
                        name: ""
                    },
                    title: "**Stelle-FM Bot**",
                    description: "Der Bot ist schon ein einem Voicechannel. Bestätige diese Aktion indem du den Befehl innerhalb 10 Sekunden erneut eingibst.",
                    footer: {
                        text: footerText
                    }
                }
            })

            awaitingConfirm[msg.author.id] = true
            setTimeout(function() {
                awaitingConfirm[msg.author.id] = undefined
            }, 10000)

            return
        }

        if(!msg.member.voiceChannelID) {
            sendEmbed(msg, {
                embed: {
                    color: 16744512,
                    author: {
                        name: ""
                    },
                    title: "**Stelle-FM Bot**",
                    description: "Trete zuerst einem Voicechannel bei",
                    footer: {
                        text: footerText
                    }
                }
            })
            return
        }
        const channel = client.channels.get(msg.member.voiceChannelID);
        channel.join().then(connection => {
            require('http').get("http://stelle-fm.stream.laut.fm/stelle-fm?t302=2018-07-31_19-11-55&uuid=40347422-3ed2-4fbd-9645-3a1ab59755f0", (res) => {
                connection.playStream(res);
            });
            /*connection.playArbitraryInput("http://stream.laut.fm/stelle-fm", {
            });*/
            isPlaying = true;
            voiceChannelID = msg.member.voiceChannelID

            getSongTitle((title) => {
                sendEmbed(msg, {
                    embed: {
                        color: 16744512,
                        author: {
                            name: ""
                        },
                        title: "**Stelle-FM Bot**",
                        description: ((title != "")?("\nGerade spielt\n**"+title+"**\n​"):"")+"\n [**Studio Cam**](https://www.youtube.com/channel/UCARa4jSnhBxtw-zv_GTszYQ/live)",
                        footer: {
                            text: footerText
                        }
                    }
                })
            })

            var exitTimeout;
            ee.addListener("voiceChange", () => {
                if(channel.members.length == 0) {
                    exitTimeout = setTimeout(function() {
                        connection.disconnect()
                    }, 1000*60*10)
                } else {
                    if(exitTimeout) {
                        clearTimeout(exitTimeout)
                    }
                }
            })
        }).catch(e => {
            // Oh no, it errored! Let's log it to console :)
            sendEmbed(msg, {
                embed: {
                    color: 16744512,
                    author: {
                        name: ""
                    },
                    title: "**Stelle-FM Bot**",
                    description: "Ich habe leider keine Berechtigung diesem Voicechannel beizutreten :slight_frown:",
                    footer: {
                        text: footerText
                    }
                }
            })
        });
    }
    else if(msg.content === "+stop") {
        //(client.voiceConnections)
        var count = 0;
        /*client.voiceConnections.every((conn) => {
            console.log(conn)
            conn.disconnect()
            count++;
        })*/
        if(msg.guild.voiceConnection) {
            msg.guild.voiceConnection.disconnect();
            count = 1;
        }
        sendEmbed(msg, {
            embed: {
                color: 16744512,
                author: {
                    name: ""
                },
                title: "**Stelle-FM Bot**",
                description: (count !== 0)?"Tschüss :wave:":"Ich hab doch garnichts gemacht :slight_frown:",
                footer: {
                    text: footerText
                }
            }
        })
        isPlaying = false;
    } else if(msg.content === "+help") {
        sendEmbed(msg, {
            embed: {
                color: 16744512,
                author: {
                    name: ""
                },
                title: "**Stelle-FM Bot Help**",
                description: "IIII1II!IHHhhhh ein BOT!\n​",
                fields: [{
                    name: "+play | +stelle",
                    value: "Tritt deinem Voicechannel bei und spielt den Internet stream des Stelle FM Hitradio ab."
                },
                {
                    name: "+stop",
                    value: "Stoppt und verlässt den Channel"
                },
                {
                    name: "+help",
                    value: "Zeigt an was du gerade siehst :face_palm:"
                },
                {
                    name: "+cam",
                    value: "Zeigt den YouTube Livestream des Studios an :camera:"
                },
                {
                    name: "+info",
                    value: "Zeigt an welches Lied gerade spielt :notes:"
                }
                ],
                footer: {
                    text: footerText
                }
            }
        });
    } else if(msg.content === "+cam") {
        sendEmbed(msg, "https://www.youtube.com/channel/UCARa4jSnhBxtw-zv_GTszYQ/live")
    } else if(msg.content === "+info") {
        getSongTitle((title) => {
            sendEmbed(msg, {
                embed: {
                    color: 16744512,
                    author: {
                        name: ""
                    },
                    title: "**Stelle-FM Bot**",
                    description: "\nGerade spielt\n**" + ((title)?title:"nichts") + "**\n\n*Diese Funktion ist ein bisschen verbuggt*",
                    footer: {
                        text: footerText
                    }
                }
            });
        })
    }
});

var timeouts = {}
client.on('voiceStateUpdate', (oldMember, newMember) => {
    let newUserChannel = newMember.voiceChannel
    let oldUserChannel = oldMember.voiceChannel

    // THIS FAILS FOR SOME REASON WHEN THE BOT WAS STILL IN A CHANNEL WHEN STARTED

    try {
        if (newMember.guild.voiceConnection && newMember.guild.voiceConnection.channel.members.size == 1) {
            timeouts[newMember.guild.id] = setTimeout(function () {
                newMember.guild.voiceConnection.disconnect()
            }, 1000*60*10)
        } else {
            if (timeouts[newMember.guild.id]) {
                clearTimeout(timeouts[newMember.guild.id])
            }
        }
    } catch(err) {
        console.log(err)
    }
})

function sendEmbed(msg, embed) {
    msg.channel.send(embed).then((smsg) => {
        setTimeout(function() {
        smsg.delete()
        try {
            msg.delete()
        } catch(err) {}
        }, 1000*60*10);
    })
}

function getSongTitle(callback) {
    internetradio.getStationInfo("http://stream.laut.fm/stelle-fm", function (error, station) {
        callback(station.title);
    });
}

client.login(token);