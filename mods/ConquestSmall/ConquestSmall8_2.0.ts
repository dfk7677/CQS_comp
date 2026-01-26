
// === ConquestSmall.ts ===
// Conquest Small mode with 3 flags, ticket bleed and UI tracking
import * as modlib from 'modlib';



const VERSION = [2, 0, 5, 0];

// Sets core constants
const INITIAL_TICKETS = 350;
const BLEED_TWO_FLAGS = -.35;
const BLEED_THREE_FLAGS = -.8;
const DEATH_TICKET_LOSS = -1;
const COUNT_DOWN_TIME = 5;
const PRELIVE_TIME = 10;
const ROUND_TIME = 1200; // 20 minutes in seconds
const POSTMATCH_TIME = 15;

const CAPTURE_TIME = 6;
const NEUTRALIZE_TIME = 9;
const CAPTURE_MULTIPLIER = 2;
const COLOR_NEUTRAL  =   mod.CreateVector(1, 1, 1);
const COLOR_FRIENDLY =   mod.CreateVector(0.0902, 0.8627, 1);
const COLOR_ENEMY    =   mod.CreateVector(1, 0.4, 0);

const REDEPLOY_TIME = 10;
const TICK_RATE = 30;
const TOTAL_TICKS = ROUND_TIME * TICK_RATE;

const playerStatus = Array(64).fill(false);
const restrictedArea = Array(64).fill(false);
const playerFirstDeploy = Array(64).fill(true);
const scoreboard = Array.from({ length: 64 }, () => [0, 0, 0, 0, 0]);
let scoresByMinute: number[][] = [];

// Defines teams
const teamNeutral: mod.Team = mod.GetTeam(0);
const team1: mod.Team = mod.GetTeam(1);
const team2: mod.Team = mod.GetTeam(2);

const serverScores = [INITIAL_TICKETS, INITIAL_TICKETS];


let countDown:number;
let liveTickCount:number;

type CapturePoint = {
    status: number;
    capturer: number;
    onPoint: number[];
    symbol: string;
    fade: number;
};

type CapturePoints = Record<number, CapturePoint>;

const capturePoints: CapturePoints = {
    201: { status: 0, capturer: 0, onPoint: [0,0], symbol: "A", fade: mod.Pi() },
    202: { status: 0, capturer: 0, onPoint: [0,0], symbol: "B", fade: mod.Pi() },
    203: { status: 0, capturer: 0, onPoint: [0,0], symbol: "C", fade: mod.Pi() }
};


let gamePhase = 0;
let gameModeStarted = false;
let serverTickCount = 0;
let phaseTickCount = 0;
let sounds: mod.SFX[] = [];
let teamVO: mod.VO[] = [];

let globalVO: mod.VO;

function DrawScoresByMinute(){
    mod.AddUIContainer("ScoresByMinute", mod.CreateVector(0,500,0), mod.CreateVector(1270,INITIAL_TICKETS+50, 0), mod.UIAnchor.TopCenter, mod.GetUIRoot(), true, 0, mod.CreateVector(0,0,0), .8, mod.UIBgFill.Solid);
    mod.SetUIWidgetDepth(mod.FindUIWidgetWithName("ScoresByMinute"), mod.UIDepth.AboveGameUI);
    const parent = mod.FindUIWidgetWithName("ScoresByMinute");
    for (let i = 0; i < scoresByMinute.length; i++) {
        const scores = scoresByMinute[i];
        mod.AddUIContainer(`Score${i}-00`, mod.CreateVector(5+i*60,0,0), mod.CreateVector(25,scores[0], 0), mod.UIAnchor.BottomLeft, parent, true, 0, COLOR_FRIENDLY, 1, mod.UIBgFill.Solid, team1);
        mod.AddUIText(`Score${i}-00text`, mod.CreateVector(5+i*60,scores[0],0), mod.CreateVector(25,25, 0), mod.UIAnchor.BottomLeft, parent, true, 0,
         mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(mod.Ceiling(scores[0])), 12, mod.CreateVector(1,1,1), 1, mod.UIAnchor.Center, team1);
        mod.AddUIContainer(`Score${i}-10`, mod.CreateVector(5+i*60+25,0,0), mod.CreateVector(25,scores[1], 0), mod.UIAnchor.BottomLeft, parent, true, 0, COLOR_ENEMY, 1, mod.UIBgFill.Solid, team1);
        mod.AddUIText(`Score${i}-10text`, mod.CreateVector(5+i*60+25,scores[1],0), mod.CreateVector(25,25, 0), mod.UIAnchor.BottomLeft, parent, true, 0,
         mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(mod.Ceiling(scores[1])), 12, mod.CreateVector(1,1,1), 1, mod.UIAnchor.Center, team1);
        mod.AddUIContainer(`Score${i}-01`, mod.CreateVector(5+i*60,0,0), mod.CreateVector(25,scores[1], 0), mod.UIAnchor.BottomLeft, parent, true, 0, COLOR_FRIENDLY, 1, mod.UIBgFill.Solid, team2);
        mod.AddUIText(`Score${i}-01text`, mod.CreateVector(5+i*60,scores[1],0), mod.CreateVector(25,25, 0), mod.UIAnchor.BottomLeft, parent, true, 0,
         mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(mod.Ceiling(scores[1])), 12, mod.CreateVector(1,1,1), 1, mod.UIAnchor.Center, team2);
        mod.AddUIContainer(`Score${i}-11`, mod.CreateVector(5+i*60+25,0,0), mod.CreateVector(25,scores[0], 0), mod.UIAnchor.BottomLeft, parent, true, 0, COLOR_ENEMY, 1, mod.UIBgFill.Solid, team2);
        mod.AddUIText(`Score${i}-11text`, mod.CreateVector(5+i*60+25,scores[0],0), mod.CreateVector(25,25, 0), mod.UIAnchor.BottomLeft, parent, true, 0,
         mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(mod.Ceiling(scores[0])), 12, mod.CreateVector(1,1,1), 1, mod.UIAnchor.Center, team2);
    }
}


function DrawEndScoreboard() {
    mod.AddUIContainer("EndScoreboard", mod.CreateVector(0, 160,0), mod.CreateVector(920,300, 0), mod.UIAnchor.TopCenter, mod.GetUIRoot(), true, 10, mod.CreateVector(0,0,0), .8, mod.UIBgFill.Solid);
    const parent = mod.FindUIWidgetWithName("EndScoreboard");
    mod.SetUIWidgetDepth(parent, mod.UIDepth.AboveGameUI);
    mod.AddUIContainer("HeaderFriendly", mod.CreateVector(-225,0,0), mod.CreateVector(450,30, 0), mod.UIAnchor.TopCenter, parent, true, 0, COLOR_FRIENDLY, 1, mod.UIBgFill.Solid);
    mod.AddUIContainer("HeaderEnemy", mod.CreateVector(225,0,0), mod.CreateVector(450,30, 0), mod.UIAnchor.TopCenter, parent, true, 0, COLOR_ENEMY, 1, mod.UIBgFill.Solid);
    mod.AddUIText("HeaderFriendlyPlayer", mod.CreateVector(10,0,0), mod.CreateVector(220,30, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("HeaderFriendly"), true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.Player), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterLeft);
    mod.AddUIText("HeaderFriendlyScore", mod.CreateVector(230,0,0), mod.CreateVector(70,30, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("HeaderFriendly"), true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.ScoreboardScore), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight);
    mod.AddUIText("HeaderFriendlyKills", mod.CreateVector(300,0,0), mod.CreateVector(70,30, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("HeaderFriendly"), true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.ScoreboardKills), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight);
    mod.AddUIText("HeaderFriendlyDeaths", mod.CreateVector(370,0,0), mod.CreateVector(70,30, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("HeaderFriendly"), true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.ScoreboardDeaths), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight);
    mod.AddUIText("HeaderEnemyPlayer", mod.CreateVector(10,0,0), mod.CreateVector(220,30, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("HeaderEnemy"), true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.Player), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterLeft);
    mod.AddUIText("HeaderEnemyScore", mod.CreateVector(230,0,0), mod.CreateVector(70,30, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("HeaderEnemy"), true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.ScoreboardScore), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight);
    mod.AddUIText("HeaderEnemyKills", mod.CreateVector(300,0,0), mod.CreateVector(70,30, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("HeaderEnemy"), true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.ScoreboardKills), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight);
    mod.AddUIText("HeaderEnemyDeaths", mod.CreateVector(370,0,0), mod.CreateVector(70,30, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("HeaderEnemy"), true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.ScoreboardDeaths), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight);

     const players = mod.AllPlayers();
     const n = mod.CountOf(players);
     const scoreboard1 = [];
     const scoreboard2 = [];
     for (let i = 0; i < n; i++) {
        const player = mod.ValueInArray(players, i);
        const id = mod.GetObjId(player);
        const team = mod.GetTeam(player);
        if (mod.Equals(team, team1)) {
            scoreboard1.push([player, scoreboard[id][0], scoreboard[id][1], scoreboard[id][2]]);
        } else {
            scoreboard2.push([player, scoreboard[id][0], scoreboard[id][1], scoreboard[id][2]]);
        }
        
        

     }
     const sortedScoreboard1 = scoreboard1.sort((a, b) => b[1] - a[1]);
     const sortedScoreboard2 = scoreboard2.sort((a, b) => b[1] - a[1]);
     for (let i = 0; i < sortedScoreboard1.length; i++) {
        mod.AddUIText("FriendlyPlayer" + i +1, mod.CreateVector(10,30 + 30*i,0), mod.CreateVector(220,30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard1[i][0]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterLeft, team1);
        mod.AddUIText("FriendlyScore" + i +1, mod.CreateVector(230,30 + 30*i,0), mod.CreateVector(70,30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard1[i][1]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight, team1);
        mod.AddUIText("FriendlyKills" + i +1, mod.CreateVector(300,30 + 30*i,0), mod.CreateVector(70,30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard1[i][2]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight, team1);
        mod.AddUIText("FriendlyDeaths" + i +1, mod.CreateVector(370,30 + 30*i,0), mod.CreateVector(70,30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard1[i][3]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight, team1);
        mod.AddUIText("EnemyPlayer" + i +1, mod.CreateVector(450+10,30 + 30*i,0), mod.CreateVector(220,30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard1[i][0]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterLeft, team2);
        mod.AddUIText("EnemyScore" + i +1, mod.CreateVector(450+230,30 + 30*i,0), mod.CreateVector(70,30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard1[i][1]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight, team2);
        mod.AddUIText("EnemyKills" + i +1, mod.CreateVector(450+300,30 + 30*i,0), mod.CreateVector(70,30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard1[i][2]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight, team2);
        mod.AddUIText("EnemyDeaths" + i +1, mod.CreateVector(450+370,30 + 30*i,0), mod.CreateVector(70,30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard1[i][3]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight, team2);
    }
    for (let i = 0; i < sortedScoreboard2.length; i++) {
        mod.AddUIText("FriendlyPlayer" + i +2, mod.CreateVector(10, 30 + 30 * i,0), mod.CreateVector(220, 30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard2[i][0]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterLeft, team2);
        mod.AddUIText("FriendlyScore" + i +2, mod.CreateVector(230, 30 + 30 * i,0), mod.CreateVector(70, 30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard2[i][1]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight, team2);
        mod.AddUIText("FriendlyKills" + i +2, mod.CreateVector(300, 30 + 30 * i,0), mod.CreateVector(70, 30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard2[i][2]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight, team2);
        mod.AddUIText("FriendlyDeaths" + i +2, mod.CreateVector(370, 30 + 30 * i,0), mod.CreateVector(70, 30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard2[i][3]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight, team2);
        mod.AddUIText("EnemyPlayer" + i +2, mod.CreateVector(450 +10, 30 + 30 * i,0), mod.CreateVector(220, 30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard2[i][0]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterLeft, team1);
        mod.AddUIText("EnemyScore" + i +2, mod.CreateVector(450 + 230, 30 + 30 * i,0), mod.CreateVector(70, 30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard2[i][1]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight, team1);
        mod.AddUIText("EnemyKills" + i +2, mod.CreateVector(450 + 300, 30 + 30 * i,0), mod.CreateVector(70, 30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard2[i][2]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight, team1);
        mod.AddUIText("EnemyDeaths" + i +2, mod.CreateVector(450 + 370, 30 + 30 * i,0), mod.CreateVector(70, 30, 0), mod.UIAnchor.TopLeft, parent, true,
     0, mod.CreateVector(1,1,1), 0, mod.UIBgFill.None, mod.Message(sortedScoreboard2[i][3]), 24, mod.CreateVector(1,1,1), 1, mod.UIAnchor.CenterRight, team1);
     }

}

function FlashFlag(id: number) {

    
    capturePoints[id].fade += 2* mod.Pi() / TICK_RATE;
    mod.SetUITextAlpha(mod.FindUIWidgetWithName(`FLAG${capturePoints[id].symbol}1`), (mod.SineFromRadians(capturePoints[id].fade) + 1) / 2);
    mod.SetUITextAlpha(mod.FindUIWidgetWithName(`FLAG${capturePoints[id].symbol}2`), (mod.SineFromRadians(capturePoints[id].fade) + 1) / 2);
    
}

function UnflashFlag(id: number) {
    if (capturePoints[id].fade != mod.Pi()) {
        mod.SetUITextAlpha(mod.FindUIWidgetWithName(`FLAG${capturePoints[id].symbol}1`), 1);
        mod.SetUITextAlpha(mod.FindUIWidgetWithName(`FLAG${capturePoints[id].symbol}2`), 1);
        capturePoints[id].fade = mod.Pi();
    }
    
}

function ChangeTickets() {
    let teamcps = [0,0];
    const cps = mod.AllCapturePoints();
    const n = mod.CountOf(cps);
    for (let i = 0; i < n; i++) {
        const cp = mod.ValueInArray(cps, i);
        if (mod.Equals(mod.GetCurrentOwnerTeam(cp), team1)) {
            teamcps[0] += 1;
        }
        else if (mod.Equals(mod.GetCurrentOwnerTeam(cp), team2)) {
            teamcps[1] += 1;
        }
    }
    
    if (teamcps[0] == 2) {
        serverScores[1] += BLEED_TWO_FLAGS / 10;
    }
    else if (teamcps[0] == 3) {
        serverScores[1] += BLEED_THREE_FLAGS / 10;
    }
    else if (teamcps[1] == 2) {
        serverScores[0] += BLEED_TWO_FLAGS / 10;
    }
    else if (teamcps[1] == 3) {
        serverScores[0] += BLEED_THREE_FLAGS / 10;
    }

    mod.SetUITextLabel(mod.FindUIWidgetWithName("TeamFriendlyScore1"), mod.Message(mod.Ceiling(serverScores[0])));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("TeamFriendlyScore2"), mod.Message(mod.Ceiling(serverScores[1])));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("TeamOpponentScore1"), mod.Message(mod.Ceiling(serverScores[1])));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("TeamOpponentScore2"), mod.Message(mod.Ceiling(serverScores[0])));

    
}


function UpdateScoreboard() {
    const players = mod.AllPlayers();
    const n = mod.CountOf(players);
    for (let i = 0; i < n; i++) {
        const player = mod.ValueInArray(players, i);
        const id = mod.GetObjId(player);
        mod.SetScoreboardPlayerValues(player, scoreboard[id][0], scoreboard[id][1], scoreboard[id][2], scoreboard[id][3], scoreboard[id][4]);
    }
}
function SetUITime() {
    mod.SetUITextLabel(mod.FindUIWidgetWithName("RemainingTime"), getRemainingTime());
}

function SetRedeployTimeForAll(time: number) {
    const players = mod.AllPlayers();
    const n = mod.CountOf(players);
    for (let i = 0; i < n; i++) {
        const player = mod.ValueInArray(players, i);
        mod.SetRedeployTime(player, time);
    }
}

function CheckForAllReady(): void {
    
    const players = mod.AllPlayers();
    const n = mod.CountOf(players);
    for (let i = 0; i < n; i++) {
        const player = mod.ValueInArray(players, i);
        if (!playerStatus[mod.GetObjId(player)]) return;
    }
    gamePhase = 1;
    phaseTickCount = 0;
}

function addRestrictedAreaUI (eventPlayer: mod.Player){
    const id = mod.GetObjId(eventPlayer);
    mod.AddUIContainer("RestrictedAreaContainer" + id, mod.CreateVector(0,0,0), mod.CreateVector(8000, 4000, 0), mod.UIAnchor.TopCenter, mod.GetUIRoot(), true, 0, mod.CreateVector(.3, 0, 0), 0.6,
        mod.UIBgFill.Solid, mod.UIDepth.AboveGameUI, eventPlayer);
    
    mod.AddUIText(
        "RestrictedAreaText" + mod.GetObjId(eventPlayer),
        mod.CreateVector(0, 200, 0),
        mod.CreateVector(600, 200, 0),
        mod.UIAnchor.TopCenter,
        mod.FindUIWidgetWithName("RestrictedAreaContainer" + id),
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.4,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.RestrictedArea),
        80,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center
    )
}

function removeRestrictedAreaUI (eventPlayer: mod.Player) {
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("RestrictedAreaContainer" + mod.GetObjId(eventPlayer)));
}

function addPrematchUI() {    
    
    mod.AddUIContainer("PreMatchContainer", mod.CreateVector(0,70,0), mod.CreateVector(960, 290, 0), mod.UIAnchor.TopCenter, mod.GetUIRoot(), true, 10, mod.CreateVector(0, 0, 0), 0.4,
        mod.UIBgFill.Solid);
    const parent = mod.FindUIWidgetWithName("PreMatchContainer");
    mod.AddUIText(
        "PreMatchHeaderText",
        mod.CreateVector(0, 10, 0),
        mod.CreateVector(200, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.4,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.PreMatch),
        40,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center
    )
    
    mod.AddUIText(
        "PreMatchTeam1Label",
        mod.CreateVector(20, 0, 0),
        mod.CreateVector(100, 30, 0),
        mod.UIAnchor.TopLeft,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.4,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.PreMatchTeam1Label),
        24,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.CenterLeft
    )

    mod.AddUIText(
        "PreMatchTeam2Label",
        mod.CreateVector(20, 0, 0),
        mod.CreateVector(100, 30, 0),
        mod.UIAnchor.TopRight,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.4,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.PreMatchTeam2Label),
        24,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.CenterRight
    )

    const players = mod.AllPlayers();
    const n = mod.CountOf(players);
    let teamPlayers = [0, 0];
    for (let i = 0; i < n; i++) {
        const player = mod.ValueInArray(players, i);

        mod.AddUIText(
            "StatusText" + mod.GetObjId(player),
            mod.CreateVector(0, 60, 0),
            mod.CreateVector(200, 60, 0),
            mod.UIAnchor.TopCenter,
            parent,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0.4,
            mod.UIBgFill.None,
            playerStatus[mod.GetObjId(player)] ? mod.Message(mod.stringkeys.Ready) : mod.Message(mod.stringkeys.NotReady),
            45,
            playerStatus[mod.GetObjId(player)] ? mod.CreateVector(0, 1, 0) : mod.CreateVector(1, 0, 0),
            1,
            mod.UIAnchor.Center,
            player            
        )
        if (mod.Equals(mod.GetTeam(player), mod.GetTeam(1))) {
            teamPlayers[0] += 1;
            mod.AddUIText(
                "Player" + mod.GetObjId(player),
                mod.CreateVector(20, 30*teamPlayers[0], 0),
                mod.CreateVector(300, 30, 0),
                mod.UIAnchor.TopLeft,
                parent,
                true,
                0,
                mod.CreateVector(0, 0, 0),
                0.4,
                mod.UIBgFill.None,
                mod.Message(player),
                22,
                playerStatus[mod.GetObjId(player)] ? mod.CreateVector(0, 1, 0) : mod.CreateVector(1, 0, 0),                
                1,
                mod.UIAnchor.CenterLeft
            )

            
        }
        else {
            teamPlayers[1] += 1;
            mod.AddUIText(
                "Player" + mod.GetObjId(player),
                mod.CreateVector(20, 30*teamPlayers[1], 0),
                mod.CreateVector(300, 30, 0),
                mod.UIAnchor.TopRight,
                parent,
                true,
                0,
                mod.CreateVector(0, 0, 0),
                0.4,
                mod.UIBgFill.None,
                mod.Message(player),
                22,
                playerStatus[mod.GetObjId(player)] ? mod.CreateVector(0, 1, 0) : mod.CreateVector(1, 0, 0),
                1,
                mod.UIAnchor.CenterRight
            )
        }
        const height = mod.Max(mod.Max(teamPlayers[0], teamPlayers[1]) * 30 + 50, 290);        
        //mod.SetUIWidgetSize(parent, mod.CreateVector(600, height, 0));
        
    }
    
}

function addCountdownUI() {
    
    mod.AddUIContainer("CountdownContainer", mod.CreateVector(0,250,0), mod.CreateVector(300, 170, 0), mod.UIAnchor.TopCenter, mod.GetUIRoot(), true, 10, mod.CreateVector(0, 0, 0), 0.6,
     mod.UIBgFill.Solid);
    const parent = mod.FindUIWidgetWithName("CountdownContainer");
    mod.SetUIWidgetDepth(parent, mod.UIDepth.AboveGameUI);
    mod.AddUIText(
        "MatchStartsText",
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(300, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.4,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.MatchStarts),
        50,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center
    )

    mod.AddUIText(
        "CountDownText",
        mod.CreateVector(0, 50, 0),
        mod.CreateVector(300, 100, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.4,
        mod.UIBgFill.None,
        mod.Message(10),
        100,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center
    )
}

function addLiveUI() {
    mod.AddUIContainer("LiveContainer", mod.CreateVector(0, 80, 0), mod.CreateVector(300, 300, 0), mod.UIAnchor.TopCenter, mod.GetUIRoot(), true, 0, mod.CreateVector(0, 0, 0), 0.4,
        mod.UIBgFill.None);
    const parent = mod.FindUIWidgetWithName("LiveContainer");
    
    mod.AddUIContainer("StatusContainer", mod.CreateVector(0,80,0), mod.CreateVector(300, 40, 0), mod.UIAnchor.TopCenter, mod.GetUIRoot(), true, 5, mod.CreateVector(0, 0, 0), 0.6,
        mod.UIBgFill.Solid);
    const parent2 = mod.FindUIWidgetWithName("StatusContainer");
    mod.SetUIWidgetDepth(parent2, mod.UIDepth.AboveGameUI);
    mod.AddUIText(
        "RemainingTime",
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(100, 30, 0),
        mod.UIAnchor.TopCenter,
        parent2,
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        1,
        mod.UIBgFill.None,
        getRemainingTime(),
        20,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center
    )

    mod.AddUIText(
        "TeamFriendlyScore1",
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(100, 30, 0),
        mod.UIAnchor.TopLeft,
        parent2,
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        1,
        mod.UIBgFill.None,
        mod.Message(serverScores[0]),
        28,
        COLOR_FRIENDLY,
        1,
        mod.UIAnchor.Center,
        team1
    );

    mod.AddUIText(
        "TeamOpponentScore1",
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(100, 30, 0),
        mod.UIAnchor.TopRight,
        parent2,
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        1,
        mod.UIBgFill.None,
        mod.Message(serverScores[1]),
        26,
        COLOR_ENEMY,
        1,
        mod.UIAnchor.Center,
        team1
    )

    mod.AddUIText(
        "TeamFriendlyScore2",
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(100, 30, 0),
        mod.UIAnchor.TopLeft,
        parent2,
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        1,
        mod.UIBgFill.None,
        mod.Message(serverScores[1]),
        26,
        COLOR_FRIENDLY,
        1,
        mod.UIAnchor.Center,
        team2
    );

    mod.AddUIText(
        "TeamOpponentScore2",
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(100, 30, 0),
        mod.UIAnchor.TopRight,
        parent2,
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        1,
        mod.UIBgFill.None,
        mod.Message(serverScores[0]),
        26,
        COLOR_ENEMY,
        1,
        mod.UIAnchor.Center,
        team2
    )

    

    mod.AddUIText(
        "FLAGA1",
        mod.CreateVector(-100, 50, 0),
        mod.CreateVector(50, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.6,
        mod.UIBgFill.Solid,
        mod.Message("A"),
        44,
        getFlagColor(team1, 201),
        1,
        mod.UIAnchor.Center,
        team1            
    )

    mod.AddUIText(
        "FLAGB1",
        mod.CreateVector(0, 50, 0),
        mod.CreateVector(50, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.6,
        mod.UIBgFill.Solid,
        mod.Message("B"),
        44,
        getFlagColor(team1, 202),
        1,
        mod.UIAnchor.Center,
        team1            
    )

    mod.AddUIText(
        "FLAGC1",
        mod.CreateVector(100, 50, 0),
        mod.CreateVector(50, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.4,
        mod.UIBgFill.Blur,
        mod.Message("C"),
        45,
        getFlagColor(team1, 203),
        1,
        mod.UIAnchor.Center,
        team1            
    )


    mod.AddUIText(
        "FLAGA2",
        mod.CreateVector(-100, 50, 0),
        mod.CreateVector(50, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.6,
        mod.UIBgFill.Solid,
        mod.Message("A"),
        45,
        getFlagColor(team2, 201),
        1,
        mod.UIAnchor.Center,
        team2         
    )

    mod.AddUIText(
        "FLAGB2",
        mod.CreateVector(0, 50, 0),
        mod.CreateVector(50, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.6,
        mod.UIBgFill.Solid,
        mod.Message("B"),
        44,
        getFlagColor(team2, 202),
        1,
        mod.UIAnchor.Center,
        team2            
    )

    mod.AddUIText(
        "FLAGC2",
        mod.CreateVector(100, 50, 0),
        mod.CreateVector(50, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.6,
        mod.UIBgFill.Solid,
        mod.Message("C"),
        44,
        getFlagColor(team2, 203),
        1,
        mod.UIAnchor.Center,
        team2            
    )
}

function addEndScreenUI(){
    mod.AddUIContainer("EndContainer", mod.CreateVector(0,0,0), mod.CreateVector(9000, 1080, 0), mod.UIAnchor.TopCenter, mod.GetUIRoot(), true, 0, mod.CreateVector(0, 0, 0), 0.6,
        mod.UIBgFill.Solid);
    const parent = mod.FindUIWidgetWithName("EndContainer");
    
    const time = liveTickCount / TICK_RATE;
    const minutes = mod.Floor(time / 60);
    const totalseconds = mod.Floor(time % 60);
    const seconds = totalseconds % 10;
    const seconds10 = mod.Floor(totalseconds / 10);

    if (serverScores[0] < 0) {
        serverScores[0] = 0;
    }
    if (serverScores[1] < 0) {
        serverScores[1] = 0;
    }
    if (liveTickCount < 1200 * 30) {
        scoresByMinute.push([serverScores[0], serverScores[1]]);
    }

    mod.AddUIText(
        "TotalTime",
        mod.CreateVector(0, 85, 0),
        mod.CreateVector(100, 50, 0),
        mod.UIAnchor.TopCenter,
        mod.GetUIRoot(),
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        1,
        mod.UIBgFill.None,
        mod.Message("{}:{}{}", minutes, seconds10, seconds),
        20,
        mod.CreateVector(1, 1, 1),
        0,
        mod.UIAnchor.Center
    );
    

    mod.AddUIText(
        "FinalScoreText",
        mod.CreateVector(0, 50, 0),
        mod.CreateVector(400, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        1,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.PostMatch),
        48,
        mod.CreateVector(1, 1, 1),
        0,
        mod.UIAnchor.Center
    );
    mod.AddUIText(
        "Team1EndFriendlyScore",
        mod.CreateVector(-200, 100, 0),
        mod.CreateVector(100, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.6,
        mod.UIBgFill.Solid,
        mod.Message(mod.Ceiling(serverScores[0])),
        48,
        COLOR_FRIENDLY,
        0,
        mod.UIAnchor.Center,
        team1
    );
    mod.AddUIText(
        "Team1EndEnemyScore",
        mod.CreateVector(200, 100, 0),
        mod.CreateVector(100, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        1,
        mod.CreateVector(0, 0, 0),
        0.6,
        mod.UIBgFill.Solid,
        mod.Message(mod.Ceiling(serverScores[1])),
        48,
        COLOR_ENEMY,
        0,
        mod.UIAnchor.Center,
        team1
    );
    mod.AddUIText(
        "Team2EndFriendlyScore",
        mod.CreateVector(-200, 100, 0),
        mod.CreateVector(100, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.6,
        mod.UIBgFill.Solid,
        mod.Message(mod.Ceiling(serverScores[1])),
        48,
        COLOR_FRIENDLY,
        0,
        mod.UIAnchor.Center,
        team2
    );
    mod.AddUIText(
        "Team2EndEnemyScore",
        mod.CreateVector(200, 100, 0),
        mod.CreateVector(100, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.6,
        mod.UIBgFill.Solid,
        mod.Message(mod.Ceiling(serverScores[0])),
        48,
        COLOR_ENEMY,
        0,
        mod.UIAnchor.Center,
        team2
    );

    mod.AddUIText(
        "PostMatchDash",
        mod.CreateVector(0, 100, 0),
        mod.CreateVector(100, 50, 0),
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        0,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.Dash),
        48,
        COLOR_NEUTRAL,
        0,
        mod.UIAnchor.Center
    );
    DrawScoresByMinute();
    DrawEndScoreboard();
}

function getFlagColor(team: mod.Team, cpId: number): mod.Vector {
    const capturePoint = mod.GetCapturePoint(cpId);
    const owner = mod.GetCurrentOwnerTeam(capturePoint);
    if (mod.Equals(owner, teamNeutral)) {
        return COLOR_NEUTRAL;
    }
    else {
        if (mod.Equals(owner, team)) {
            return COLOR_FRIENDLY;
        }
        else {
            return COLOR_ENEMY;
        }
    }
}

function getRemainingTime(): mod.Message {
    const remainingTime = ROUND_TIME - phaseTickCount / TICK_RATE;
    let minutes = mod.Floor(remainingTime / 60);
    let totalseconds = mod.Floor(remainingTime % 60);
    let seconds = totalseconds % 10;
    let seconds10 = mod.Floor(totalseconds / 10)
    return mod.Message("{}:{}{}", minutes, seconds10, seconds);
}

async function initializeGamePhase() {
    const players = mod.AllPlayers();
    if (gamePhase == 0) {
        // PreMatch phase logic
        console.log("Phase: PreMatch");
        const wIcon1 = mod.GetWorldIcon(5001);
        const wIcon2 = mod.GetWorldIcon(5002);
        const wIcon5 = mod.GetWorldIcon(5011);

        
        mod.SetWorldIconText(wIcon1, mod.Message(mod.stringkeys.SwitchTeam, 2));
        mod.SetWorldIconText(wIcon2, mod.Message(mod.stringkeys.Ready));
        mod.SetWorldIconText(wIcon5, mod.Message(mod.stringkeys.HQ, 1));
        mod.SetWorldIconColor(wIcon5, mod.CreateVector(1, 0, 0));

        const wIcon3 = mod.GetWorldIcon(5003);
        const wIcon4 = mod.GetWorldIcon(5004);
        const wIcon6 = mod.GetWorldIcon(5012);

        
        mod.SetWorldIconText(wIcon3, mod.Message(mod.stringkeys.SwitchTeam, 1));
        mod.SetWorldIconText(wIcon4, mod.Message(mod.stringkeys.Ready));
        mod.SetWorldIconText(wIcon6, mod.Message(mod.stringkeys.HQ, 2));
        mod.SetWorldIconColor(wIcon6, mod.CreateVector(1, 0, 0));
        
        mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
        mod.SetScoreboardColumnNames(mod.Message(mod.stringkeys.ScoreboardScore), mod.Message(mod.stringkeys.ScoreboardKills), 
            mod.Message(mod.stringkeys.ScoreboardDeaths), mod.Message(mod.stringkeys.ScoreboardAssists), mod.Message(mod.stringkeys.ScoreboardRevives));
        mod.SetGameModeTimeLimit(60000);
        SetRedeployTimeForAll(0);
        mod.EnableGameModeObjective(mod.GetCapturePoint(201), false);
        mod.EnableGameModeObjective(mod.GetCapturePoint(202), false);
        mod.EnableGameModeObjective(mod.GetCapturePoint(203), false);
        const n = mod.CountOf(players);
        for (let i = 0; i < n; i++) {
            const player = mod.ValueInArray(players, i);
             
                
            if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
                const id = mod.GetObjId(player);
                playerStatus[id] = true;
            }
            
            

        }
        //await mod.Wait(1.5);
        addPrematchUI();
    } else if (gamePhase == 1) {
        // Countdown phase logic
        console.log("Phase: Countdown");
        countDown = PRELIVE_TIME;
        
        for (let i = 0; i < 4; i++) {
            mod.EnableWorldIconImage(mod.GetWorldIcon(5001 + i), false);
            mod.EnableWorldIconText(mod.GetWorldIcon(5001 + i), false);

            //mod.EnableInteractPoint(mod.GetInteractPoint(2001 + i), false);
        }
        mod.EnableWorldIconText(mod.GetWorldIcon(5011), false);
        mod.EnableWorldIconText(mod.GetWorldIcon(5012), false);
        mod.EnableInteractPoint(mod.GetInteractPoint(2002), false);
        mod.EnableInteractPoint(mod.GetInteractPoint(2004), false);
        mod.DeleteAllUIWidgets();
        mod.UndeployAllPlayers();
        const vehicleSpawner1 = mod.GetVehicleSpawner(701);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner1, true);
        const vehicleSpawner2 = mod.GetVehicleSpawner(702);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner2, true);
        const vehicleSpawner3 = mod.GetVehicleSpawner(703);
        const vehicleSpawner4 = mod.GetVehicleSpawner(704);
        if (vehicleSpawner3) {
            mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner3, true);
            mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner4, true);
        }
        const emplacementSpawner1 = mod.GetEmplacementSpawner(801);    
        const emplacementSpawner2 = mod.GetEmplacementSpawner(802);
        if (emplacementSpawner1 && emplacementSpawner2) {
            mod.SetEmplacementSpawnerAutoSpawn(emplacementSpawner1, true);
            mod.SetEmplacementSpawnerAutoSpawn(emplacementSpawner2, true);
        }

        mod.EnableGameModeObjective(mod.GetCapturePoint(201), true);
        mod.EnableGameModeObjective(mod.GetCapturePoint(202), true);
        mod.EnableGameModeObjective(mod.GetCapturePoint(203), true);
        //await mod.Wait(1.5);
        addCountdownUI();
    } else if (gamePhase == 2) {
        // Live phase logic
        console.log("Phase: Live");
        mod.DeleteAllUIWidgets();
        const players = mod.AllPlayers();
        const n = mod.CountOf(players);
        for (let i = 0; i < n; i++) {
            const player = mod.ValueInArray(players, i);
            if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
                mod.EnableAllInputRestrictions(player, false);
                mod.EnableInputRestriction(player, mod.RestrictedInputs.FireWeapon, false);
            }
            

        }
        addLiveUI();
        SetRedeployTimeForAll(10);

        // Sounds
        sounds.push(mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTick_IsFriendly_SimpleLoop2D, 
            mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0)));
        sounds.push(mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTick_IsEnemy_SimpleLoop2D, 
            mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0)));
        sounds.push(mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_OnContested_SimpleLoop2D, 
            mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0)));

        globalVO = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
        teamVO.push(mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0)));
        teamVO.push(mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0)));
    } else if (gamePhase == 3) {
        // EndScreen phase logic
        mod.EnableGameModeObjective(mod.GetCapturePoint(201), false);
        mod.EnableGameModeObjective(mod.GetCapturePoint(202), false);
        mod.EnableGameModeObjective(mod.GetCapturePoint(203), false);
        mod.DeleteAllUIWidgets();
        phaseTickCount = 0;
        countDown = POSTMATCH_TIME;

        mod.DeployAllPlayers();
        addEndScreenUI();
        mod.PlaySound(mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_EOR_RoundOutcome_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0)), 1);
        if (serverScores[0] > serverScores[1]) {
            mod.PlayVO(teamVO[0], mod.VoiceOverEvents2D.GlobalEOMVictory, mod.VoiceOverFlags.Delta, team1);
            mod.PlayVO(teamVO[1], mod.VoiceOverEvents2D.GlobalEOMDefeat, mod.VoiceOverFlags.Delta, team2);
        }
        else if (serverScores[0] < serverScores[1]) {
            mod.PlayVO(teamVO[1], mod.VoiceOverEvents2D.GlobalEOMVictory, mod.VoiceOverFlags.Delta, team2);
            mod.PlayVO(teamVO[0], mod.VoiceOverEvents2D.GlobalEOMDefeat, mod.VoiceOverFlags.Delta, team1);
        }
        
        const n = mod.CountOf(players);
        for (let i = 0; i < n; i++) {
            const player = mod.ValueInArray(players, i);
            if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
                mod.EnableAllInputRestrictions(player, true);
                mod.EnableInputRestriction(player, mod.RestrictedInputs.FireWeapon, true);
                /*
                mod.StopSound(sounds[0], player);
                mod.StopSound(sounds[1], player);
                mod.StopSound(sounds[2], player);
                */
            }
        }
        console.log("Phase: EndScreen");
    }
   
}


export function OnGameModeStarted() {
    console.log("Started")
    gameModeStarted = true;
}

export function OngoingGlobal() {
    if (!gameModeStarted) {
        return;
    }

    if (phaseTickCount == 0) {
        initializeGamePhase();
    }




    phaseTickCount += 1;
    serverTickCount += 1;

    if (gamePhase == 1) {
        if (mod.Modulo(phaseTickCount, TICK_RATE) == 0) {
            countDown -= 1;
            mod.SetUITextLabel(mod.FindUIWidgetWithName("CountDownText"), mod.Message(countDown));
            
            if (countDown == 0) {
                gamePhase = 2;
                phaseTickCount = 0;
                return;
            }
        }
    }

    if (gamePhase == 2) {

        if (mod.Modulo(phaseTickCount, TICK_RATE / 10) == 0) {
            SetUITime();
            ChangeTickets();
            UpdateScoreboard();
            if (mod.Modulo(phaseTickCount, 60*TICK_RATE) == 0) {
                scoresByMinute.push([serverScores[0], serverScores[1]]);
            }
        }

        if (phaseTickCount == TOTAL_TICKS - 30*TICK_RATE) {
            mod.PlayVO(globalVO, mod.VoiceOverEvents2D.Time30Left, mod.VoiceOverFlags.Delta);            
        }
        else if (phaseTickCount == TOTAL_TICKS - 120*TICK_RATE) {
            mod.PlayVO(globalVO, mod.VoiceOverEvents2D.Time120Left, mod.VoiceOverFlags.Delta);
        }
        else if (phaseTickCount == TOTAL_TICKS - 60*TICK_RATE) {
            mod.PlayVO(globalVO, mod.VoiceOverEvents2D.Time60Left, mod.VoiceOverFlags.Delta);
        } else if (phaseTickCount == TOTAL_TICKS) {
            console.log("Live ends by time.");
            liveTickCount = phaseTickCount;
            gamePhase = 3;
            phaseTickCount = 0;
            return;
        }

        if (serverScores[0] == 20) {
            mod.PlayVO(teamVO[0], mod.VoiceOverEvents2D.PlayerCountFriendlyLow, mod.VoiceOverFlags.Delta, team1);
            mod.PlayVO(teamVO[1], mod.VoiceOverEvents2D.PlayerCountEnemyLow, mod.VoiceOverFlags.Delta, team2);
        }

        if (serverScores[1] == 20) {
            mod.PlayVO(teamVO[1], mod.VoiceOverEvents2D.PlayerCountFriendlyLow, mod.VoiceOverFlags.Delta, team2);
            mod.PlayVO(teamVO[0], mod.VoiceOverEvents2D.PlayerCountEnemyLow, mod.VoiceOverFlags.Delta, team1);
        } 
        
        if (serverScores[0] <= 0 || serverScores[1] <= 0) {
            console.log("Live ends by score.");
            liveTickCount = phaseTickCount;
            gamePhase = 3;
            phaseTickCount = 0;
            return;
        }
    }

    if (gamePhase == 3) {
        if (phaseTickCount <= 60) {
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("TotalTime"), phaseTickCount / 60);
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("FinalScoreText"), phaseTickCount / 60);
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("Team1EndFriendlyScore"), phaseTickCount / 60);
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("Team2EndFriendlyScore"), phaseTickCount / 60);
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("Team1EndEnemyScore"), phaseTickCount / 60);
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("Team2EndEnemyScore"), phaseTickCount / 60);
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("PostMatchDash"), phaseTickCount / 60);
            
        }
        if (mod.Modulo(phaseTickCount, TICK_RATE) == 0) {
            
            countDown -= 1;
            
            if (countDown == 0) {
                console.log("PostMatch ends.")
                

                
                if (serverScores[0] > serverScores[1]) {
                    mod.EndGameMode(team1);
                } else if (serverScores[0] < serverScores[1]) {
                    mod.EndGameMode(team2);
                } else {
                    mod.EndGameMode(teamNeutral);
                }
            }
        }
    }
    

}

export function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint) {

    if (gamePhase == 2) {
        const playersOnPoint = mod.GetPlayersOnPoint(eventCapturePoint);
        const n = mod.CountOf(playersOnPoint);
        const currentProgress = mod.GetCaptureProgress(eventCapturePoint);
        const currentCapturer = mod.GetOwnerProgressTeam(eventCapturePoint);
        const id = mod.GetObjId(eventCapturePoint);
        const previousCapturer = capturePoints[id].capturer;
        capturePoints[id].capturer = 0;
        if (n > 0) {
            
            let teamPlayers = [0, 0];
            for (let i = 0; i < n; i++) {
                const player = mod.ValueInArray(playersOnPoint, i);
                const uiWidget = mod.FindUIWidgetWithName("Progress" + mod.GetObjId(player));
                if (uiWidget)
                {
                    const width = mod.Ceiling(mod.Multiply(60, currentProgress));                        
                    mod.SetUIWidgetSize(uiWidget, mod.CreateVector(width, 60, 0));                        
                    mod.SetUIWidgetBgColor(uiWidget, mod.Equals(mod.GetTeam(player), currentCapturer) ? COLOR_FRIENDLY : COLOR_ENEMY);
                }
                if (mod.Equals(mod.GetTeam(player), mod.GetTeam(1))) {
                    teamPlayers[0] += 1;
                }
                else {
                    teamPlayers[1] += 1;
                }
            }


            if (teamPlayers[0] > teamPlayers[1]) {
                if (mod.Equals(currentCapturer, team1)) {
                    if (currentProgress < 1) {
                        // Capturing
                        mod.SetCapturePointCapturingTime(eventCapturePoint, CAPTURE_TIME);
                        capturePoints[id].status = 1;
                        capturePoints[id].capturer = 1;
                        FlashFlag(id);
                    }
                    else {
                        UnflashFlag(id)
                    }
                    
                }
                else {
                    if (currentProgress > 0) {
                        // Neutralizing
                        mod.SetCapturePointNeutralizationTime(eventCapturePoint, NEUTRALIZE_TIME);
                        capturePoints[id].status = 2;
                        capturePoints[id].capturer = 1;
                    }
                    FlashFlag(id);
                }
                
            }
            else if (teamPlayers[1] > teamPlayers[0]) {
                if (mod.Equals(currentCapturer, team2)) {
                    if (currentProgress < 1) {
                        // Capturing
                        mod.SetCapturePointCapturingTime(eventCapturePoint, CAPTURE_TIME);
                        capturePoints[id].status = 1;
                        capturePoints[id].capturer = 2;
                        FlashFlag(id);
                    } else {
                        UnflashFlag(id)
                    }
                    
                }
                else {
                    if (currentProgress > 0) {
                        // Neutralizing
                        mod.SetCapturePointNeutralizationTime(eventCapturePoint, NEUTRALIZE_TIME);
                        capturePoints[id].status = 2;
                        
                    }
                    capturePoints[id].capturer = 2;
                    FlashFlag(id);
                }
                
                    
            } else if (teamPlayers[0] == teamPlayers[1]) {
                capturePoints[id].status = 3;
                capturePoints[id].capturer = 3;
                FlashFlag(id);
            }

            for (let i = 0; i < n; i++) {
                const player = mod.ValueInArray(playersOnPoint, i);
                const uiFriendlyWidget = mod.FindUIWidgetWithName("FriendlyOnPoint" + mod.GetObjId(player));
                const uiEnemyWidget = mod.FindUIWidgetWithName("EnemyOnPoint" + mod.GetObjId(player));
                if (mod.Equals(mod.GetTeam(player), mod.GetTeam(1))) {
                    if (uiEnemyWidget) {
                        mod.SetUITextLabel(uiEnemyWidget, mod.Message(teamPlayers[1]));
                    }
                    if (uiFriendlyWidget) {
                        mod.SetUITextLabel(uiFriendlyWidget, mod.Message(teamPlayers[0]));
                    }
                }
                else {
                    if (uiEnemyWidget) {
                        mod.SetUITextLabel(uiEnemyWidget, mod.Message(teamPlayers[0]));
                    }
                    if (uiFriendlyWidget) {
                        mod.SetUITextLabel(uiFriendlyWidget, mod.Message(teamPlayers[1]));
                    }
                }

            }
                 
            
        } else {
            capturePoints[id].capturer = 0;
            UnflashFlag(id);
            if (currentProgress < 1 && currentProgress > 0) {
                const currentOwner = mod.GetCurrentOwnerTeam(eventCapturePoint);
                
                if (mod.Equals(currentOwner, teamNeutral)) {
                    // Neutralizing
                    mod.SetCapturePointNeutralizationTime(eventCapturePoint, NEUTRALIZE_TIME);
                }
                else {
                    // Capturing
                    mod.SetCapturePointCapturingTime(eventCapturePoint, CAPTURE_TIME);
                }
                
            }
        }
        if (previousCapturer != capturePoints[id].capturer) {
            
            for (let i = 0; i < n; i++) {

                const player = mod.ValueInArray(playersOnPoint, i);
                /*
                mod.StopSound(sounds[0], player);
                mod.StopSound(sounds[1], player);
                mod.StopSound(sounds[2], player);
                
                
                if (capturePoints[id].capturer == 3) {
                    mod.PlaySound(sounds[2], 0.2, player);
                }
                else if (capturePoints[id].capturer == mod.GetObjId(mod.GetTeam(player))) {
                    mod.PlaySound(sounds[0], 0.2, player);
                } else if (capturePoints[id].capturer != 0){
                    mod.PlaySound(sounds[1], 0.2, player);
                }
                */
                    
                
            }
        }
    }
}

export function OngoingPlayer(eventPlayer: mod.Player) {
    if (gamePhase == 2) {
        const id = mod.GetObjId(eventPlayer);
        if (restrictedArea[id]) {
            mod.DealDamage(eventPlayer, 0.33);
        }
    }
    
}

export async function OnPlayerEnterCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint) {
    if (gamePhase == 2) {
        
        const currentProgress = mod.GetCaptureProgress(eventCapturePoint);
        const currentCapturer = mod.GetOwnerProgressTeam(eventCapturePoint);
        const playersOnPoint = mod.GetPlayersOnPoint(eventCapturePoint);
        const n = mod.CountOf(playersOnPoint);
        const team = mod.GetTeam(eventPlayer);
        let teamPlayers = [0, 0];
        for (let i = 0; i < n; i++) {
            const player = mod.ValueInArray(playersOnPoint, i);
            if (mod.Equals(mod.GetTeam(player), team)) {
                teamPlayers[0] += 1;
            }
            else {
                teamPlayers[1] += 1;
            }

        }
        const id = mod.GetObjId(eventCapturePoint)
        
        

        mod.AddUIContainer("OnPoint"+ mod.GetObjId(eventPlayer), mod.CreateVector(0,110,0), mod.CreateVector(300, 60,0), mod.UIAnchor.TopLeft,
            mod.FindUIWidgetWithName("LiveContainer"), true, 0,mod.CreateVector(1,1,1) , 0.4, mod.UIBgFill.None, eventPlayer);
        const parent = mod.FindUIWidgetWithName("OnPoint"+ mod.GetObjId(eventPlayer))
        mod.AddUIContainer("ProgressParent"+ mod.GetObjId(eventPlayer), mod.CreateVector(0,0,0), mod.CreateVector(60, 60,0), mod.UIAnchor.Center,parent,
         true, 0,mod.CreateVector(.5,.5,.5) , 1, mod.UIBgFill.Solid, eventPlayer);
        mod.AddUIContainer("Progress"+ mod.GetObjId(eventPlayer), mod.CreateVector(0,0,0), mod.CreateVector(mod.Ceiling(currentProgress *60), 60,0), mod.UIAnchor.CenterLeft,
            mod.FindUIWidgetWithName("ProgressParent"+ mod.GetObjId(eventPlayer)), true, 0, mod.Equals(mod.GetTeam(eventPlayer), currentCapturer) ? COLOR_FRIENDLY : COLOR_ENEMY, 1, mod.UIBgFill.Solid, eventPlayer);
          
        mod.AddUIText("FlagLetter" + mod.GetObjId(eventPlayer), mod.CreateVector(0, 0, 0), mod.CreateVector(60, 60, 0), mod.UIAnchor.Center,
            parent, true, 0, mod.CreateVector(0, 0, 0), 0.4, mod.UIBgFill.None, mod.Message(capturePoints[id].symbol), 50,
            mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center);
        mod.AddUIText("FriendlyOnPoint" + mod.GetObjId(eventPlayer), mod.CreateVector(60, 0, 0), mod.CreateVector(40, 40, 0), mod.UIAnchor.CenterLeft,
            parent, true, 0, mod.CreateVector(0, 0, 0), 0.4, mod.UIBgFill.Solid, mod.Message(teamPlayers[0]), 34, COLOR_FRIENDLY, 1, mod.UIAnchor.Center);
        mod.AddUIText("EnemyOnPoint" + mod.GetObjId(eventPlayer), mod.CreateVector(60, 0, 0), mod.CreateVector(40, 40, 0), mod.UIAnchor.CenterRight,
            parent, true, 0, mod.CreateVector(0, 0, 0), 0.4, mod.UIBgFill.Solid, mod.Message(teamPlayers[1]), 34, COLOR_ENEMY, 1, mod.UIAnchor.Center);

        /*
        await mod.Wait(0.1);
        if (capturePoints[id].capturer == 3) {
            mod.PlaySound(sounds[2], 0.2, eventPlayer);
        }
        else if (capturePoints[id].capturer == mod.GetObjId(mod.GetTeam(eventPlayer))) {
            mod.PlaySound(sounds[0], 0.2, eventPlayer);
            
        } else if (capturePoints[id].capturer != 0){
            mod.PlaySound(sounds[1], 0.2, eventPlayer);
        }
            */
    }
    

}

export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint) {
    if (gamePhase == 2) {
        
        mod.DeleteUIWidget(mod.FindUIWidgetWithName("OnPoint"+ mod.GetObjId(eventPlayer)));
        /*
        mod.StopSound(sounds[0], eventPlayer);
        mod.StopSound(sounds[1], eventPlayer);
        mod.StopSound(sounds[2], eventPlayer);
        */
    }
}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    
    if (gamePhase == 0) {
        const id = mod.GetObjId(eventPlayer)
        
        if ((mod.GetObjId(eventInteractPoint) == 2001 || mod.GetObjId(eventInteractPoint) == 2003)) {
            if (playerStatus[id])
            {
                modlib.ShowNotificationMessage(mod.Message(mod.stringkeys.CannotChangeTeamWhenReady), eventPlayer);
                return;
            }

            mod.UndeployPlayer(eventPlayer);
                
            if (mod.Equals(mod.GetTeam(eventPlayer), team1)) {
                try {
                    mod.SetTeam(eventPlayer, team2); 
                } catch (e) {
                    console.log(e);
                }
                    
                    
            } else {
                try {
                    mod.SetTeam(eventPlayer, team1);                
                } catch (e) {
                    console.log(e);
                }
                    
            }
                
            
        } else if (mod.GetObjId(eventInteractPoint) == 2002 || mod.GetObjId(eventInteractPoint) == 2004) {
            playerStatus[id] = !playerStatus[id];
            CheckForAllReady();
        }
        mod.DeleteAllUIWidgets();
        addPrematchUI();
        
        
        
    } else if (gamePhase == 2) {
        

        if (mod.GetObjId(eventInteractPoint) == 2001 || mod.GetObjId(eventInteractPoint) == 2003) {
            const team = mod.GetTeam(eventPlayer);
            const team1numPlayers = modlib.getPlayersInTeam(team1).length;
            const team2numPlayers = modlib.getPlayersInTeam(team2).length;
            if (mod.Equals(team, team1)) {
                if (team1numPlayers > team2numPlayers) {
                    mod.UndeployPlayer(eventPlayer);
                    try {
                        mod.SetTeam(eventPlayer, team2);
                        mod.DeleteAllUIWidgets();
                        addLiveUI();
                    } catch (e) {
                        console.log(e);
                    }
                    
                    
                }
            }
            else if (mod.Equals(team, team2)) {
                if (team2numPlayers > team1numPlayers) {
                    mod.UndeployPlayer(eventPlayer);
                    try {
                        mod.SetTeam(eventPlayer, team1);
                        mod.DeleteAllUIWidgets();
                        addLiveUI();
                    } catch (e) {
                        console.log(e);
                    }
                    
                }
                
            }

                       
            

            
        }
    }
}

export async function OnPlayerJoinGame(eventPlayer: mod.Player): Promise<void> {
    mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.PlayerJoined, eventPlayer, mod.GetObjId(eventPlayer)));    
    await mod.Wait(3);    
    mod.DeleteAllUIWidgets();
    if (gamePhase == 0) { 
        if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) {
            const id = mod.GetObjId(eventPlayer);
            playerStatus[id] = true;
        }
        addPrematchUI();
        return;        
    }
    if (gamePhase == 1) {
        
        addCountdownUI();
        return;
    }
    if (gamePhase == 2) {
        
        addLiveUI();
        return;
    }
    
}


export function OnPlayerEarnedKillAssist(eventPlayer: mod.Player, eventOtherPlayer: mod.Player) {
    if (gamePhase == 2) {
        const id = mod.GetObjId(eventPlayer);
        scoreboard[id][3] += 1;
        scoreboard[id][0] += 50;
        
    }
    
}

export function OnPlayerEarnedKill(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, eventDeathType: mod.DeathType, eventWeaponUnlock: mod.WeaponUnlock) {
    if (gamePhase == 2) {
        const id = mod.GetObjId(eventPlayer);
        scoreboard[id][1] += 1;
        scoreboard[id][0] += 100;
    }
}

export function OnRevived(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    if (gamePhase == 2) {
        const id = mod.GetObjId(eventOtherPlayer);
        scoreboard[id][0] += 100;
        scoreboard[id][4] += 1;
    }
}

export function OnPlayerUndeploy(eventPlayer: mod.Player) {
    
    if (gamePhase == 2) {
        const id = mod.GetObjId(eventPlayer);
        scoreboard[id][2] += 1;
        
        
    }
}



export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    const id = mod.GetObjId(eventPlayer);
    if (gamePhase == 0) {
        mod.EnableInputRestriction(eventPlayer, mod.RestrictedInputs.FireWeapon, true);  
    }
    
    else if (gamePhase == 1) {        
        mod.SetRedeployTime(eventPlayer, REDEPLOY_TIME);
        playerFirstDeploy[id] = false;
        mod.EnableAllInputRestrictions(eventPlayer, true);
    }

    else if (gamePhase == 2) {
        const team = mod.GetTeam(eventPlayer);
        
        
        if (!playerFirstDeploy[id]) {
            if (modlib.Equals(team, team1)) 
            {
                    serverScores[0] += DEATH_TICKET_LOSS; 
            }
            else {
                serverScores[1] += DEATH_TICKET_LOSS;
            }
            return;
        } 
        else {
            mod.EnableAllInputRestrictions(eventPlayer, false);
            mod.EnableInputRestriction(eventPlayer, mod.RestrictedInputs.FireWeapon, false);
        }
        
        playerFirstDeploy[id] = false;
    }
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (gamePhase == 2) {
        const playerId = mod.GetObjId(eventPlayer);
        const areaId = mod.GetObjId(eventAreaTrigger);

        if (areaId > 20000) {
            restrictedArea[playerId] = true;
            addRestrictedAreaUI(eventPlayer);
        }
        const team = mod.GetTeam(eventPlayer);
        
        if (mod.Equals(team, team2) && (mod.GetObjId(eventAreaTrigger) == 7001)) {
            console.log("Entered enemy HQ")
            if (mod.Equals(mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsInVehicle), true)) {
                
                mod.ForcePlayerExitVehicle(eventPlayer);
                mod.DealDamage(mod.GetVehicleFromPlayer(eventPlayer), 2000);
            }
            else {
                restrictedArea[playerId] = true;
                addRestrictedAreaUI(eventPlayer);
            }
            
            
        } 
        else if (mod.Equals(team, team1) && (mod.GetObjId(eventAreaTrigger) == 7002)) {
            console.log("Entered enemy HQ")
            if (mod.Equals(mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsInVehicle), true)) {
                
                mod.ForcePlayerExitVehicle(eventPlayer);
                mod.DealDamage(mod.GetVehicleFromPlayer(eventPlayer), 2000);
            }
            else {
                restrictedArea[playerId] = true;
                addRestrictedAreaUI(eventPlayer);
            }
            
        }
        
    }
}

export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (gamePhase == 2) {
        const playerId = mod.GetObjId(eventPlayer);
        const areaId = mod.GetObjId(eventAreaTrigger);
        const team = mod.GetTeam(eventPlayer);
        if (areaId > 20000 || (mod.Equals(team, team2) && (areaId == 7001)) || (mod.Equals(team, team1) && (areaId == 7002))) {
            restrictedArea[playerId] = false;
            removeRestrictedAreaUI(eventPlayer);
        }
    }
}

export function OnCapturePointLost(eventCapturePoint: mod.CapturePoint): void {
    const id = mod.GetObjId(eventCapturePoint);
    mod.SetUITextColor(mod.FindUIWidgetWithName(`FLAG${capturePoints[id].symbol}1`), COLOR_NEUTRAL);
    mod.SetUITextColor(mod.FindUIWidgetWithName(`FLAG${capturePoints[id].symbol}2`), COLOR_NEUTRAL);
    
}

export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint): void {
    const id = mod.GetObjId(eventCapturePoint);
    const currentOwner = mod.GetCurrentOwnerTeam(eventCapturePoint);
    
    if (mod.Equals(currentOwner, team1)) {
        mod.SetUITextColor(mod.FindUIWidgetWithName(`FLAG${capturePoints[id].symbol}1`), COLOR_FRIENDLY);
        mod.SetUITextColor(mod.FindUIWidgetWithName(`FLAG${capturePoints[id].symbol}2`), COLOR_ENEMY);
    }
    else {
        mod.SetUITextColor(mod.FindUIWidgetWithName(`FLAG${capturePoints[id].symbol}1`), COLOR_ENEMY);
        mod.SetUITextColor(mod.FindUIWidgetWithName(`FLAG${capturePoints[id].symbol}2`), COLOR_FRIENDLY);
    }
        
    
}


