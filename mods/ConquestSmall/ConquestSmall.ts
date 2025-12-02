// === ConquestSmall.ts ===
// Conquest Small mode with 3 flags, ticket bleed and UI tracking
import * as modlib from 'modlib';

const VERSION = [1, 2, 0];

// Define Classes
class Player {
    public player: mod.Player;
    public friendlyCapWidget: mod.UIWidget | null;
    public enemyCapWidget: mod.UIWidget | null;
    public progressBarWidget: mod.UIWidget | null;
    public friendlyScoreWidget: mod.UIWidget | null;
    public opponentScoreWidget: mod.UIWidget | null;
    public flagWidget: {[key: string]: mod.UIWidget | null};
    public onHQ: boolean;
    public isDeployed: boolean;
    
    private _scoreboard: number[];
    private _onCapturePoint: mod.CapturePoint | null;
    private _firstDeploy:boolean;
    private _ready: boolean;
    public id: number;
    public connected: boolean;
    public team: mod.Team;

    constructor(player: mod.Player) {
        this.player = player;
        this._scoreboard = [0,0,0,0,0];
        this._onCapturePoint = null;
        this._firstDeploy = true;
        this._ready = false; //_ready
        this.friendlyCapWidget = null;
        this.enemyCapWidget = null;
        this.progressBarWidget = null;
        this.friendlyScoreWidget = null;
        this.opponentScoreWidget = null;
        this.flagWidget = {
            'A': null,
            'B': null,            
            'C': null
        };
        this.id = modlib.getPlayerId(this.player);
        this.connected = true;
        this.team = mod.GetTeam(this.player);
        this.onHQ = true;
        this.isDeployed = false;
    }

    setCapturePoint(capturePoint: mod.CapturePoint | null) {
        this._onCapturePoint = capturePoint;
    }

    getCapturePoint(): mod.CapturePoint | null {
        return this._onCapturePoint;
    }

    isFirstDeploy() {
        this._firstDeploy = false;
        return this._firstDeploy;
    }

    

    updateScoreboard() {
        mod.SetScoreboardPlayerValues(this.player, this._scoreboard[0], this._scoreboard[1], this._scoreboard[2], this._scoreboard[3], this._scoreboard[4]);
    }

    addScore(score: number) {
        this._scoreboard[0] += score;
    }   

    addKill() {
        this._scoreboard[1] += 1;
    }

    addDeath() {
        this._scoreboard[2] += 1;
    }

    addKillAssist() {
        this._scoreboard[3] += 1;
    }

    addCapture() {
        this._scoreboard[4] += 1;
    }

    

    isReady() {
        return this._ready;
    }

    changeReady() {
        this._ready = !this._ready;
        if (this._ready) {
            mod.SetUITextColor(mod.FindUIWidgetWithName("ReadyText" + this.id), mod.CreateVector(0, 1, 0));
            mod.SetUITextLabel(mod.FindUIWidgetWithName("ReadyText" + this.id), mod.Message(mod.stringkeys.Ready));
        }
        else {
            mod.SetUITextColor(mod.FindUIWidgetWithName("ReadyText" + this.id), mod.CreateVector(1, 0, 0));
            mod.SetUITextLabel(mod.FindUIWidgetWithName("ReadyText" + this.id), mod.Message(mod.stringkeys.NotReady));
        }
    }

    clearScoreboard() {
        this._scoreboard = [0,0,0,0,0];
        this._ready = false;
    }

    setWidgets() {
        this.friendlyCapWidget = mod.FindUIWidgetWithName("FriendlyCap" + this.id);
        this.enemyCapWidget = mod.FindUIWidgetWithName("EnemyCap" + this.id);
        this.progressBarWidget = mod.FindUIWidgetWithName("CapProgress" + this.id);
    }

    setTeam() {
        this.team = mod.GetTeam(this.player);
           
    }

    addUI() {
        if (gameStatus == 3)
        {
            let t = [];
            
            if (mod.Equals(this.team,team1)) {
                t = [0,1];
                
            }
            else {
                t = [1,0];
                
            }
            
            
            mod.AddUIText(
                "TeamFriendlyScore"+this.id,
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(100, 50, 0),
                mod.UIAnchor.CenterLeft,
                mod.FindUIWidgetWithName("LiveContainer"),
                true,
                0,
                mod.CreateVector(0.2, 0.2, 0.2),
                1,
                mod.UIBgFill.None,
                mod.Message(serverScores[t[0]]),
                24,
                COLOR_FRIENDLY,
                1,
                mod.UIAnchor.Center,
                this.player
            );

            mod.AddUIText(
                "TeamOpponentScore"+this.id,
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(100, 50, 0),
                mod.UIAnchor.CenterRight,
                mod.FindUIWidgetWithName("LiveContainer"),
                true,
                0,
                mod.CreateVector(0.2, 0.2, 0.2),
                1,
                mod.UIBgFill.None,
                mod.Message(serverScores[t[1]]),
                24,
                COLOR_ENEMY,
                1,
                mod.UIAnchor.Center,
                this.player
            )

            mod.AddUIText(
                "FLAGA"+this.id,
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(50, 50, 0),
                mod.UIAnchor.Center,
                mod.FindUIWidgetWithName("FlagContainerA"),
                true,
                0,
                mod.CreateVector(0, 0, 0),
                0.4,
                mod.UIBgFill.Blur,
                mod.Message("A"),
                27,
                serverCapturePoints[201].getColor(this.team),
                1,
                mod.UIAnchor.Center,
                this.player            
            )

            mod.AddUIText(
                "FLAGB"+this.id,
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(50, 50, 0),
                mod.UIAnchor.Center,
                mod.FindUIWidgetWithName("FlagContainerB"),
                true,
                0,
                mod.CreateVector(0, 0, 0),
                0.4,
                mod.UIBgFill.Blur,
                mod.Message("B"),
                27,
                serverCapturePoints[202].getColor(this.team),
                1,
                mod.UIAnchor.Center,
                this.player            
            )

            mod.AddUIText(
                "FLAGC"+this.id,
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(50, 50, 0),
                mod.UIAnchor.Center,
                mod.FindUIWidgetWithName("FlagContainerC"),
                true,
                0,
                mod.CreateVector(0, 0, 0),
                0.4,
                mod.UIBgFill.Blur,
                mod.Message("C"),
                27,
                serverCapturePoints[203].getColor(this.team),
                1,
                mod.UIAnchor.Center,
                this.player            
            )

            this.flagWidget['A'] = mod.FindUIWidgetWithName("FLAGA"+this.id);
            this.flagWidget['B'] = mod.FindUIWidgetWithName("FLAGB"+this.id);
            this.flagWidget['C'] = mod.FindUIWidgetWithName("FLAGC"+this.id);
            this.friendlyScoreWidget = mod.FindUIWidgetWithName("TeamFriendlyScore"+this.id);
            this.opponentScoreWidget = mod.FindUIWidgetWithName("TeamOpponentScore"+this.id);
        }

        
    }

    updateTickets() {
        if (this.friendlyScoreWidget !== null && this.opponentScoreWidget !== null) {
            mod.SetUITextLabel(this.friendlyScoreWidget, mod.Message(getFriendlyScore(this.team)));
            mod.SetUITextLabel(this.opponentScoreWidget, mod.Message(getOpponentScore(this.team)));
        }
    }


}

class CapturePoint {
    public capturePoint: mod.CapturePoint;
    public symbol: string;
    public id: number;
    private _owner: mod.Team;
    private _onPoint: number[];
    private _captureProgress: number;
    private _previousCaptureProgress: number;
    private _capturingTeam: mod.Team;
    private _fade: number;


    constructor(id: number, symbol: string) {
        this.id = id;
        this.symbol = symbol;
        this.capturePoint = mod.GetCapturePoint(id);
        this._owner = teamNeutral;
        this._onPoint = [];
        this._captureProgress = 0;
        this._previousCaptureProgress = 0;
        this._capturingTeam = teamNeutral;
        this._fade = mod.Pi();
        mod.SetCapturePointCapturingTime(this.capturePoint, CAPTURE_TIME);
        mod.EnableGameModeObjective(this.capturePoint, false);
    }

    addOnPoint(playerId: number) {
        this._onPoint.push(playerId);
    }

    removeOnPoint(playerId: number) {
        this._onPoint.splice(this._onPoint.indexOf(playerId), 1);
    }

    getOnPoint(): number[] {
        let onPoint = [0,0];
        for (let i = 0; i < this._onPoint.length; i++) {
            const p = serverPlayers.get(this._onPoint[i]);
            if (p !== undefined) {
                if (mod.Equals(p.team, team1)) {
                    onPoint[0] += 1;
                }
                else {
                    onPoint[1] += 1;
                }
            }
        }
        return onPoint;
    }

    setOwner(owner: mod.Team) {
        this._owner = owner;
    }

    getOwner(): mod.Team {
        return this._owner;
    }

    

    setCaptureProgress() {
        this._previousCaptureProgress = this._captureProgress;
        this._captureProgress = mod.GetCaptureProgress(this.capturePoint);
        
        const onPoint = this.getOnPoint();
        if (this._captureProgress > this._previousCaptureProgress) {

            if (onPoint[0] > onPoint[1]) {
                this._capturingTeam = team1;
            }
            else if (onPoint[0] < onPoint[1]) {
                this._capturingTeam = team2;
            }
            mod.SetCapturePointCapturingTime(this.capturePoint, CAPTURE_TIME);
        }
        else if (this._captureProgress < this._previousCaptureProgress) {
            if (onPoint[0] > onPoint[1]) {
                this._capturingTeam = team2;
            }
            else if (onPoint[0] < onPoint[1]) {
                this._capturingTeam = team1;
            }
            mod.SetCapturePointNeutralizationTime(this.capturePoint, NEUTRALIZE_TIME);
        }
        const fade = this._captureProgress != 0 && this._captureProgress != 1;
        if (fade) {
            this._fade += 2* mod.Pi() / TICK_RATE;
        }
        else {
            this._fade = mod.Pi();

        }

        serverPlayers.forEach(p => {
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("FLAG" + this.symbol + p.id), (mod.SineFromRadians(this._fade) + 1) / 2);
        });

        
        
    }

    getCaptureProgress(): number {
        return this._captureProgress;
    }

    getCapturingTeam(): mod.Team {
        return this._capturingTeam;
    }

    getColor(team:mod.Team): mod.Vector {
        if (mod.Equals(team, this._owner)) {
            return COLOR_FRIENDLY;
        }
        else {
            if (mod.Equals(this._owner, teamNeutral)) {
                return COLOR_NEUTRAL;
            }
            else {
                return COLOR_ENEMY;
            }
        }
    }
    
}

// Sets core constants
const INITIAL_TICKETS = 250;
const BLEED_TWO_FLAGS = -.3;
const BLEED_THREE_FLAGS = -.75;
const DEATH_TICKET_LOSS = -1;
const COUNT_DOWN_TIME = 5;
const PRELIVE_TIME = 30;
const ROUND_TIME = 1200; // 20 minutes in seconds
const POSTMATCH_TIME = 10;

const CAPTURE_TIME = 6;
const NEUTRALIZE_TIME = 8;
const CAPTURE_MULTIPLIER = 2;
const COLOR_NEUTRAL  =   mod.CreateVector(1, 1, 1);
const COLOR_FRIENDLY =   mod.CreateVector(0.0902, 0.8627, 1);
const COLOR_ENEMY    =   mod.CreateVector(1, 0.4, 0);
const CAPTURE_POINT_FIRST_ID = 200;
const TICK_RATE = 30;
const TOTAL_TICKS = ROUND_TIME * TICK_RATE;


// Sets up variables
let serverTickCount:number = 0;
let phaseTickCount:number = 0;
const serverPlayers = new Map<number, Player>();
const voflags: {[key: string]: mod.VoiceOverFlags} = {
    "A": mod.VoiceOverFlags.Alpha,
    "B": mod.VoiceOverFlags.Bravo,
    "C": mod.VoiceOverFlags.Charlie
}

const disconnectedPlayers: Player[] = [];

let vo: {[key: number]: mod.VO} = {};


let serverScores: number[] = [INITIAL_TICKETS, INITIAL_TICKETS];
let countDown:number = COUNT_DOWN_TIME;

let gameStatus:number = -1;

let initialization: boolean[] = [false, false, false, false];
let UIContainers: mod.UIWidget[] = [];
let gameModeStarted: boolean = false;

// Defines teams
const teamNeutral: mod.Team = mod.GetTeam(0);
const team1: mod.Team = mod.GetTeam(1);
const team2: mod.Team = mod.GetTeam(2);

let serverCapturePoints: { [key: number]: CapturePoint } = {
    201: new CapturePoint(201, "A"),
    202: new CapturePoint(202, "B"),
    203: new CapturePoint(203, "C")
}




// UI
const UIWidget = modlib.ParseUI(
{
    name: "UIContainer",
    type: "Container",
    position: [0, 0],
    size: [7000 , 5000],
    anchor: mod.UIAnchor.TopCenter,
    visible: true,
    padding: 0,
    bgColor: [0, 0, 0],
    bgAlpha: 1,
    bgFill: mod.UIBgFill.None,
    children: [
        {
        name: "LiveContainer",
        type: "Container",
        position: [0, 50],
        size: [300, 50],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgColor: [0.0314, 0.0431, 0.0431],
        bgAlpha: 0.4,
        bgFill: mod.UIBgFill.Blur,
        children: [
            {
                name: "RemainingTime",
                type: "Text",
                position: [0, 0],
                size: [100, 50],
                anchor: mod.UIAnchor.Center,
                visible: true,
                padding: 0,
                bgColor: [0.2, 0.2, 0.2],
                bgAlpha: 1,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.RemainingTime,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 20,
                textAnchor: mod.UIAnchor.Center
            },
            {
                name: "FlagContainerB",
                type: "Container",
                position: [0, 60],
                size: [50, 50],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgColor: [0.0314, 0.0431, 0.0431],
                bgAlpha: 0.4,
                bgFill: mod.UIBgFill.None,
        
            },
            {
                name: "FlagContainerC",
                type: "Container",
                position: [100, 60],
                size: [50, 50],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgColor: [0.0314, 0.0431, 0.0431],
                bgAlpha: 0.4,
                bgFill: mod.UIBgFill.None,
            
            },
            {
                name: "FlagContainerA",
                type: "Container",
                position: [-100, 60],
                size: [50, 50],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgColor: [0.0314, 0.0431, 0.0431],
                bgAlpha: 0.4,
                bgFill: mod.UIBgFill.None,
            
            },
            {

                name: "ActiveFlagContainer",
                type: "Container",
                position: [0, 120],
                size: [180, 80],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgColor: [0.0314, 0.0431, 0.0431],
                bgAlpha: 0.4,
                bgFill: mod.UIBgFill.None,
                
            
            },
        ]},
        {
            name: "PostMatchContainer",
            type: "Container",
            position: [0, 0],
            size: [7000, 5000],
            anchor: mod.UIAnchor.TopCenter,
            visible: true,
            padding: 0,
            bgColor: [0, 0, 0],
            bgAlpha: 1,
            bgFill: mod.UIBgFill.None,
        },
        {
            name: "PreMatchContainer",
            type: "Container",
            position: [0, 50],
            size: [400, 150],
            anchor: mod.UIAnchor.TopCenter,
            visible: true,
            padding: 0,
            bgColor: [0, 0, 0],
            bgAlpha: 0.5,
            bgFill: mod.UIBgFill.Blur,
            children: [
            {
                name: "PreMatchText",
                type: "Text",
                position: [0, 10],
                size: [200, 50],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgColor: [0.2, 0.2, 0.2],
                bgAlpha: 1,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.PreMatch,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 40,
                textAnchor: mod.UIAnchor.Center
            },
            {
                name: "PreMatchTeam1Label",
                type: "Text",
                position: [-150, 60],
                size: [100, 30],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgColor: [0.2, 0.2, 0.2],
                bgAlpha: 1,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.PreMatchTeam1Label,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 24,
                textAnchor: mod.UIAnchor.Center
            },
            {
                name: "PreMatchTeam1",
                type: "Text",
                position: [-150, 90],
                size: [50, 30],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgColor: [0.2, 0.2, 0.2],
                bgAlpha: 1,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.PreMatchTeam1,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 24,
                textAnchor: mod.UIAnchor.Center
            },
            {
                name: "PreMatchTeam2Label",
                type: "Text",
                position: [150, 60],
                size: [100, 30],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgColor: [0.2, 0.2, 0.2],
                bgAlpha: 1,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.PreMatchTeam2Label,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 24,
                textAnchor: mod.UIAnchor.Center
            },
            {
                name: "PreMatchTeam2",
                type: "Text",
                position: [150, 90],
                size: [50, 30],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgColor: [0.2, 0.2, 0.2],
                bgAlpha: 1,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.PreMatchTeam2,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 24,
                textAnchor: mod.UIAnchor.Center
            }]
        },
        {
            name: "CountDownContainer",
            type: "Container",
            position: [0, 150],
            size: [300, 150],
            anchor: mod.UIAnchor.TopCenter,
            visible: false,
            padding: 0,
            bgColor: [0, 0, 0],
            bgAlpha: 0.5,
            bgFill: mod.UIBgFill.Blur,
            children: [
            
            {
                name: "MatchStartsText",
                type: "Text",
                position: [0, 0],
                size: [300, 50],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgColor: [0.2, 0.2, 0.2],
                bgAlpha: 1,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.Redeploying,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 50,
                textAnchor: mod.UIAnchor.Center
            },
            {
                name: "CountDownText",
                type: "Text",
                position: [0, 50],
                size: [300, 100],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgColor: [0.2, 0.2, 0.2],
                bgAlpha: 1,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.CountDownText,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 100,
                textAnchor: mod.UIAnchor.Center
            }]
            
        }]
    }
);



function SetUITime() {
    const timeWidget = mod.FindUIWidgetWithName("RemainingTime");
    const remainingTime = ROUND_TIME - phaseTickCount / 30;
    let minutes = mod.Floor(remainingTime / 60);
    let totalseconds = mod.Floor(remainingTime % 60);
    let seconds = totalseconds % 10;
    let seconds10 = mod.Floor(totalseconds / 10)
    mod.SetUITextLabel(timeWidget, mod.Message("{}:{}{}", minutes, seconds10, seconds));
}



function ChangeTickets() {
    let teamcps = [0,0];
    Object.values(serverCapturePoints).forEach(capturePoint => {
        
        
        if (mod.Equals(capturePoint.getOwner(), team1)) {
            teamcps[0] += 1;
        }
        else if (mod.Equals(capturePoint.getOwner(), team2)) {
            teamcps[1] += 1;
        }
        
    });
    
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

    
}

function getFriendlyScore(team: mod.Team): number {
    return mod.Equals(team, team1) ? mod.Ceiling(serverScores[0]) : mod.Ceiling(serverScores[1]);    
}

function getOpponentScore(team: mod.Team): number {
    return mod.Equals(team, team1) ? mod.Ceiling(serverScores[1]) : mod.Ceiling(serverScores[0]);    
}

function SetUIScores() {
    serverPlayers.forEach(p => {
        p.updateTickets();
    });
    
}

function UpdateScoreboard() {
    serverPlayers.forEach(p => {
        p.updateScoreboard();
    })
}

function InitializePreMatch() {
    console.log("Initialize PreMatch");
    phaseTickCount = 0;
    
    UIContainers = [mod.FindUIWidgetWithName("PreMatchContainer"), mod.FindUIWidgetWithName("CountDownContainer"), mod.FindUIWidgetWithName("LiveContainer"), mod.FindUIWidgetWithName("PostMatchContainer")];

    serverPlayers.forEach(p => {
        p.setTeam();
    });
    
    
    const wIcon1 = mod.GetWorldIcon(5001);
    const wIcon2 = mod.GetWorldIcon(5002);

    
    mod.SetWorldIconText(wIcon1, mod.Message(mod.stringkeys.SwitchTeam));
    mod.SetWorldIconText(wIcon2, mod.Message(mod.stringkeys.Ready));

    const wIcon3 = mod.GetWorldIcon(5003);
    const wIcon4 = mod.GetWorldIcon(5004);

    
    mod.SetWorldIconText(wIcon3, mod.Message(mod.stringkeys.SwitchTeam));
    mod.SetWorldIconText(wIcon4, mod.Message(mod.stringkeys.Ready));
    
    mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
    mod.SetGameModeTimeLimit(60000);
    
    Object.values(serverCapturePoints).forEach(cp => {
        mod.EnableGameModeObjective(cp.capturePoint, false);
    })

    vo[mod.VoiceOverEvents2D.ObjectiveNeutralised] = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    vo[mod.VoiceOverEvents2D.ObjectiveLost] = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    vo[mod.VoiceOverEvents2D.ObjectiveCaptured] = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    vo[mod.VoiceOverEvents2D.ObjectiveCapturedEnemy] = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    vo[mod.VoiceOverEvents2D.ObjectiveCapturing] = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    vo[mod.VoiceOverEvents2D.ObjectiveContested] = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    

    initialization[0] = true;
}

function InitializeCountDown() {
    console.log("Initialize CountDown");

    phaseTickCount = 0;
    countDown = COUNT_DOWN_TIME;
    mod.SetUIWidgetVisible(UIContainers[0], false);
    for (let i = 0; i < 4; i++) {
        mod.EnableWorldIconImage(mod.GetWorldIcon(5001 + i), false);
        mod.EnableWorldIconText(mod.GetWorldIcon(5001 + i), false);
        //mod.EnableInteractPoint(mod.GetInteractPoint(2001 + i), false);
    }
    mod.EnableInteractPoint(mod.GetInteractPoint(2002), false);
    mod.EnableInteractPoint(mod.GetInteractPoint(2004), false);
    mod.SetUITextLabel(mod.FindUIWidgetWithName("MatchStartsText"), mod.Message(mod.stringkeys.Redeploying));
    mod.SetUIWidgetVisible(UIContainers[1], true);

    
    

    
    initialization[1] = true;

}

function InitializePreLive() {
    console.log("Initialize PreLive");
    phaseTickCount = 0;
    countDown = PRELIVE_TIME;
    mod.SetUITextLabel(mod.FindUIWidgetWithName("MatchStartsText"), mod.Message(mod.stringkeys.MatchStarts));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("CountDownText"), mod.Message(countDown));
    mod.UndeployAllPlayers();

    Object.values(serverCapturePoints).forEach(capturePoint => {
        mod.EnableGameModeObjective(capturePoint.capturePoint, true);        
    });

    // Spawn vehicles
    if (mod.IsCurrentMap(mod.Maps.Firestorm)) {
        const vehicleSpawner1 = mod.GetVehicleSpawner(701);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner1, true);
        const vehicleSpawner2 = mod.GetVehicleSpawner(702);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner2, true);
        const vehicleSpawner3 = mod.GetVehicleSpawner(703);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner3, true);
        const vehicleSpawner4 = mod.GetVehicleSpawner(704);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner4, true);
        const emplacementSpawner1 = mod.GetEmplacementSpawner(801);
        mod.SetEmplacementSpawnerAutoSpawn(emplacementSpawner1, true);
        const emplacementSpawner2 = mod.GetEmplacementSpawner(802);
        mod.SetEmplacementSpawnerAutoSpawn(emplacementSpawner2, true);
    } else if (mod.IsCurrentMap(mod.Maps.Capstone)) {
        const vehicleSpawner1 = mod.GetVehicleSpawner(701);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner1, true);
        const vehicleSpawner2 = mod.GetVehicleSpawner(702);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner2, true);
        const vehicleSpawner3 = mod.GetVehicleSpawner(703);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner3, true);
        const vehicleSpawner4 = mod.GetVehicleSpawner(704);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner4, true);
        /*
        const emplacementSpawner1 = mod.GetEmplacementSpawner(801);
        mod.SetEmplacementSpawnerAutoSpawn(emplacementSpawner1, true);
        const emplacementSpawner2 = mod.GetEmplacementSpawner(802);
        mod.SetEmplacementSpawnerAutoSpawn(emplacementSpawner2, true);
        */
    } else if (mod.IsCurrentMap(mod.Maps.Battery)) {
        const vehicleSpawner1 = mod.GetVehicleSpawner(701);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner1, true);
        const vehicleSpawner2 = mod.GetVehicleSpawner(702);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner2, true);
        
    } else if (mod.IsCurrentMap(mod.Maps.Abbasid)) {
        const vehicleSpawner1 = mod.GetVehicleSpawner(701);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner1, true);
        const vehicleSpawner2 = mod.GetVehicleSpawner(702);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner2, true);
        
    } else if (mod.IsCurrentMap(mod.Maps.Tungsten)) {
        const vehicleSpawner1 = mod.GetVehicleSpawner(701);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner1, true);
        const vehicleSpawner2 = mod.GetVehicleSpawner(702);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner2, true);
        
    } else if (mod.IsCurrentMap(mod.Maps.Badlands)) {
        const vehicleSpawner1 = mod.GetVehicleSpawner(701);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner1, true);
        const vehicleSpawner2 = mod.GetVehicleSpawner(702);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner2, true);
        const vehicleSpawner3 = mod.GetVehicleSpawner(703);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner3, true);
        const vehicleSpawner4 = mod.GetVehicleSpawner(704);
        mod.SetVehicleSpawnerAutoSpawn(vehicleSpawner4, true);
        
    }
    
    
    initialization[2] = true;
}

// === GAME STARTUP ===
function InitializeLive() {
    console.log("Initialize Live");
    phaseTickCount = 0;
    
    
    
    mod.SetUIWidgetVisible(UIContainers[1], false);
    mod.SetUIWidgetVisible(UIContainers[2], true);

    serverPlayers.forEach(p => {
        p.setWidgets();
        p.setTeam();
        p.addUI()
        mod.EnableAllInputRestrictions(p.player, false);
        mod.EnableInputRestriction(p.player, mod.RestrictedInputs.FireWeapon, false);
    })
    serverScores = [INITIAL_TICKETS, INITIAL_TICKETS];
    
    
    
    
    mod.SetScoreboardColumnNames(mod.Message(mod.stringkeys.ScoreboardScore), mod.Message(mod.stringkeys.ScoreboardKills), 
    mod.Message(mod.stringkeys.ScoreboardDeaths), mod.Message(mod.stringkeys.ScoreboardAssists), mod.Message(mod.stringkeys.ScoreboardCaptures));
    
    
    
    //AddTeam1UI();
    //AddTeam2UI();

    SetUITime();
    SetUIScores();
    
    initialization[3] = true;
    
        
}

function InitializePostmatch()
{
    phaseTickCount = 0;
    countDown = POSTMATCH_TIME;
    mod.SetUIWidgetVisible(UIContainers[2], false);
    
    mod.DeployAllPlayers()
    
    mod.SetUIWidgetDepth(UIContainers[3], mod.UIDepth.AboveGameUI);
    mod.SetUIWidgetSize(UIContainers[3], mod.CreateVector(6000, 5000, 0));
    mod.SetUIWidgetBgFill(UIContainers[3], mod.UIBgFill.Solid);
    
    serverPlayers.forEach(p => {
        mod.EnableAllInputRestrictions(p.player, true);
        mod.EnableInputRestriction(p.player, mod.RestrictedInputs.FireWeapon, true); 
    })

    if (serverScores[0] < 0) {
        serverScores[0] = 0;
    }
    if (serverScores[1] < 0) {
        serverScores[1] = 0;
    }
    

    mod.AddUIText(
        "Team1EndFriendlyScore",
        mod.CreateVector(-200, 100, 0),
        mod.CreateVector(100, 50, 0),
        mod.UIAnchor.TopCenter,
        UIContainers[3],
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        1,
        mod.UIBgFill.None,
        mod.Message(mod.Ceiling(serverScores[0])),
        48,
        COLOR_FRIENDLY,
        1,
        mod.UIAnchor.Center,
        team1
    );
    mod.AddUIText(
        "Team1EndEnemyScore",
        mod.CreateVector(200, 100, 0),
        mod.CreateVector(100, 50, 0),
        mod.UIAnchor.TopCenter,
        UIContainers[3],
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        1,
        mod.UIBgFill.None,
        mod.Message(mod.Ceiling(serverScores[1])),
        48,
        COLOR_ENEMY,
        1,
        mod.UIAnchor.Center,
        team1
    );
    mod.AddUIText(
        "Team2EndFriendlyScore",
        mod.CreateVector(-200, 100, 0),
        mod.CreateVector(100, 50, 0),
        mod.UIAnchor.TopCenter,
        UIContainers[3],
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        1,
        mod.UIBgFill.None,
        mod.Message(mod.Ceiling(serverScores[1])),
        48,
        COLOR_FRIENDLY,
        1,
        mod.UIAnchor.Center,
        team2
    );
    mod.AddUIText(
        "Team2EndEnemyScore",
        mod.CreateVector(200, 100, 0),
        mod.CreateVector(100, 50, 0),
        mod.UIAnchor.TopCenter,
        UIContainers[3],
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        1,
        mod.UIBgFill.None,
        mod.Message(mod.Ceiling(serverScores[0])),
        48,
        COLOR_ENEMY,
        1,
        mod.UIAnchor.Center,
        team2
    );

    mod.AddUIText(
        "PostMatchDash",
        mod.CreateVector(0, 100, 0),
        mod.CreateVector(100, 50, 0),
        mod.UIAnchor.TopCenter,
        UIContainers[3],
        true,
        0,
        mod.CreateVector(0.2, 0.2, 0.2),
        0,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.Dash),
        48,
        COLOR_NEUTRAL,
        1,
        mod.UIAnchor.Center
    );

    initialization[4] = true;
}

export function OnGameModeStarted() {
    gameStatus = 0;
    serverTickCount = 0;
    gameModeStarted = true;
}
    


export function OngoingGlobal() {
    
    
    if (!gameModeStarted) {
        return;
    }
    serverTickCount += 1;
    phaseTickCount += 1;
    //console.log("Global tick: " + serverTickCount);

    if (gameStatus == 0) {
        if (!initialization[0]) {
            InitializePreMatch();
        }
        // Prematch
        // Count ready players for each team
        let readyPlayers:number[] = [0, 0];
        let totalPlayers:number[] = [0, 0];
        serverPlayers.forEach(p => {
            if (mod.Equals(p.team, team1)) {
                totalPlayers[0] += 1;
                if (p.isReady()) {
                    readyPlayers[0] += 1;
                } 

            } else if (mod.Equals(p.team, team2)) {
                totalPlayers[1] += 1;
                if (p.isReady()) {
                    readyPlayers[1] += 1;
                }
                
            }
        })
        
        mod.SetUITextLabel(mod.FindUIWidgetWithName("PreMatchTeam1"), mod.Message("{}/{}", readyPlayers[0], totalPlayers[0]));
        mod.SetUITextLabel(mod.FindUIWidgetWithName("PreMatchTeam2"), mod.Message("{}/{}", readyPlayers[1], totalPlayers[1]));
        // Check if all players are ready
        if (readyPlayers[0] == totalPlayers[0] && readyPlayers[1] == totalPlayers[1] && (readyPlayers[0] > 0 || readyPlayers[1] > 0)) {
            gameStatus = 1;
            
        }


        
    } else if (gameStatus == 1) {
        // Count Down
        if (!initialization[1]) {
            InitializeCountDown();
        }
        
        if (mod.Modulo(phaseTickCount, TICK_RATE) == 0) {
            countDown -= 1;
            mod.SetUITextLabel(mod.FindUIWidgetWithName("CountDownText"), mod.Message(countDown));
            if (countDown == 0) {
                gameStatus = 2;
            }
        }

    } else if (gameStatus == 2) {
        // Pre Live
        if (!initialization[2]) {
            InitializePreLive();
            return;
        }

        if (mod.Modulo(phaseTickCount, TICK_RATE) == 0) {
            countDown -= 1;
            mod.SetUITextLabel(mod.FindUIWidgetWithName("CountDownText"), mod.Message(countDown));
            if (countDown == 0) {
                gameStatus = 3;
            }
        }
        
        
    } else if (gameStatus == 3) {
        // Live
        if (!initialization[3]) {
            InitializeLive();
            return;
        }
        if (mod.Modulo(phaseTickCount, TICK_RATE / 10) == 0) {
            SetUITime();
            ChangeTickets();
            SetUIScores();
            UpdateScoreboard();
        }

        
        
        
        
        
        Object.values(serverCapturePoints).forEach(capturePoint => {
            capturePoint.setOwner(mod.GetCurrentOwnerTeam(capturePoint.capturePoint));
            capturePoint.setCaptureProgress();
        
        });

        if (phaseTickCount == TOTAL_TICKS) {
            console.log("Live ends by time.");
            gameStatus = 4;
            
        }
        if (serverScores[0] <= 0 || serverScores[1] <= 0) {
            console.log("Live ends by score.");
            gameStatus = 4;
            mod.SetUIWidgetVisible(mod.FindUIWidgetWithName("LiveContainer"), false);
        }
        
    }
    else {
        // Postmatch
        if (!initialization[4]) {
            console.log("Initialize Postmatch");
            InitializePostmatch();
        }

        if (mod.Modulo(phaseTickCount, TICK_RATE) == 0) {
            
            countDown -= 1;
            mod.SetUITextLabel(mod.FindUIWidgetWithName("CountDownText"), mod.Message(countDown));
            if (countDown == 0) {
                console.log("PostMatch ends.")
                /// Cannot restart round
                /*
                gameStatus = 0;
                serverPlayers.forEach(p => {
                    mod.EnableAllInputRestrictions(p.player, false);
                    mod.EnableInputRestriction(p.player, mod.RestrictedInputs.FireWeapon, false);
                    p.clearScoreboard();
                })
                mod.SwitchTeams(team1, team2);
                mod.UndeployAllPlayers();
                
                serverTickCount = 137;
                mod.SetUIWidgetVisible(mod.FindUIWidgetWithName("PreMatchContainer"), true);
                serverScores = [INITIAL_TICKETS, INITIAL_TICKETS];
                serverCapturePoints.forEach(cp => {
                    mod.SetCapturePointOwner(cp.capturePoint, teamNeutral);
                    cp.setOwner(teamNeutral);
                    console.log("Setting owner to neutral");
                })


                mod.DeleteUIWidget(mod.FindUIWidgetWithName("Team1EndFriendlyScore"));
                mod.DeleteUIWidget(mod.FindUIWidgetWithName("Team2EndFriendlyScore"));
                mod.DeleteUIWidget(mod.FindUIWidgetWithName("Team1EndEnemyScore"));
                mod.DeleteUIWidget(mod.FindUIWidgetWithName("Team2EndEnemyScore"));
                mod.DeleteUIWidget(mod.FindUIWidgetWithName("EndGameDash"));

                for (let i = 0; i < 4; i++) {
                    mod.EnableWorldIconImage(mod.GetWorldIcon(5001 + i), true);
                    mod.EnableWorldIconText(mod.GetWorldIcon(5001 + i), true);
                    mod.EnableInteractPoint(mod.GetInteractPoint(2001 + i), true);
                }

                initialization = [false, false, false, false, false];

                mod.SetUIWidgetVisible(mod.FindUIWidgetWithName("EndGameContainer"), false);
                */

                mod.DeleteUIWidget(mod.FindUIWidgetWithName("Team1EndFriendlyScore"));
                mod.DeleteUIWidget(mod.FindUIWidgetWithName("Team2EndFriendlyScore"));
                mod.DeleteUIWidget(mod.FindUIWidgetWithName("Team1EndEnemyScore"));
                mod.DeleteUIWidget(mod.FindUIWidgetWithName("Team2EndEnemyScore"));
                mod.DeleteUIWidget(mod.FindUIWidgetWithName("PostMatchDash"));
                //mod.SwitchTeams(team1, team2);

                
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

    if (serverTickCount == 10000000) {
        serverTickCount = 137;
    }
    
    
    
}

export function OngoingPlayer(eventPlayer: mod.Player) {
    if (!gameModeStarted) {
        return;
    }
    let player = serverPlayers.get(modlib.getPlayerId(eventPlayer));
    
    if (gameStatus == 0) {
        
        
        if (player !== undefined) {
            if (player.isReady()) {
            
                mod.SetUITextColor(mod.FindUIWidgetWithName("ReadyText" + player.id), mod.CreateVector(0, 1, 0));
                mod.SetUITextLabel(mod.FindUIWidgetWithName("ReadyText" + player.id), mod.Message(mod.stringkeys.Ready));
            }
            else {
                mod.SetUITextColor(mod.FindUIWidgetWithName("ReadyText" + player.id), mod.CreateVector(1, 0, 0));
                mod.SetUITextLabel(mod.FindUIWidgetWithName("ReadyText" + player.id), mod.Message(mod.stringkeys.NotReady));
            }
        }    
        
               
    } else if (gameStatus == 3)
    {
        for (let i = 0; i < disconnectedPlayers.length; i++) {
            if (mod.Equals(disconnectedPlayers[i].player, eventPlayer)) {
                // Player reconnected
                player = disconnectedPlayers[i];
                serverPlayers.set(modlib.getPlayerId(eventPlayer), player);
                if (mod.NotEqualTo(player.team, mod.GetTeam(eventPlayer))) {
                    mod.SetTeam(eventPlayer, player.team);
                }
                player.connected = true;
                player.setTeam();
                mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.PlayerReconnected, eventPlayer));
                

                mod.SetUIWidgetVisible(UIContainers[0], false);
                mod.SetUIWidgetVisible(UIContainers[2], true);
                
                player.addUI();
                disconnectedPlayers.splice(i, 1);
                break;
            }
        }
        
        
        
        
        
        
        const point = player?.getCapturePoint();
        
        if (point !== null && point !== undefined) {
            const cp = serverCapturePoints[mod.GetObjId(point)];
            const team = player?.team;
                    
                    
            
            if (modlib.Equals(team, team1)) {
                
                if (player !== undefined) {
                    if (player.friendlyCapWidget != null) 
                    {
                            mod.SetUITextLabel(player.friendlyCapWidget, mod.Message(cp.getOnPoint()[0]));
                    }
                }  
                    
                
                
                if (player !== undefined) {
                    if (player.enemyCapWidget != null) 
                    {
                        mod.SetUITextLabel(player.enemyCapWidget, mod.Message(cp.getOnPoint()[1]));
                    }
                }
                
            }
            else {
                
                if (player !== undefined) {
                    if (player.friendlyCapWidget != null) 
                    {
                        mod.SetUITextLabel(player.friendlyCapWidget, mod.Message(cp.getOnPoint()[1]));
                    }
                }
                
                if (player !== undefined) {
                    if (player.enemyCapWidget != null) 
                    {
                        mod.SetUITextLabel(player.enemyCapWidget, mod.Message(cp.getOnPoint()[0]));
                    }
                }
                

            }
            
            
            const size = mod.CreateVector(60 * cp.getCaptureProgress(),60,0);
            
            if (player !== undefined) {
                
                if (player.progressBarWidget != null) {
                    mod.SetUIWidgetSize(player.progressBarWidget, size);
            
            

                    if (modlib.Equals(cp.getOwner(), team)) {
                        mod.SetUIWidgetBgColor(player.progressBarWidget, COLOR_FRIENDLY);
                    }
                    else if (modlib.Equals(cp.getOwner(), teamNeutral)) {
                        if (modlib.Equals(cp.getCapturingTeam(), team)) {
                            mod.SetUIWidgetBgColor(player.progressBarWidget, COLOR_FRIENDLY);
                        }
                        else {
                            mod.SetUIWidgetBgColor(player.progressBarWidget, COLOR_ENEMY);
                        }
                    }
                    else {
                        mod.SetUIWidgetBgColor(player.progressBarWidget, COLOR_ENEMY);
                    }
                }
            }
                    
                    
                    
            
            
            
        }
        
    }
    
    
   
}



export function OnPlayerJoinGame(eventPlayer: mod.Player) {
    let p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
    
    if (p == undefined) {
        p = new Player(eventPlayer);
        serverPlayers.set(p.id, p);
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.PlayerJoined, p.player));
        console.log(`Player with ID${p.id} joined server`);
        if (gameStatus == 0 || gameStatus == -1) {

            
            mod.AddUIText(
                "ReadyText" + p.id,
                mod.CreateVector(0, 60, 0),
                mod.CreateVector(200, 60, 0),
                mod.UIAnchor.TopCenter,
                mod.FindUIWidgetWithName("PreMatchContainer"),
                true,
                0,
                mod.CreateVector(0, 0, 0),
                0.4,
                mod.UIBgFill.None,
                mod.Message(mod.stringkeys.NotReady),
                45,
                mod.CreateVector(1, 0, 0),
                1,
                mod.UIAnchor.Center,
                eventPlayer            
            )

        
        }
        else if (gameStatus == 1) {
            mod.SetUIWidgetVisible(UIContainers[0], false);
            mod.SetUIWidgetVisible(UIContainers[1], true);
        }

        else if (gameStatus == 3) {
            mod.SetUIWidgetVisible(UIContainers[0], false);
            mod.SetUIWidgetVisible(UIContainers[2], true);
            p.addUI();
            
        }
        
        
    }
    else {
        
    }
    
    
    
        
    
      
}

export function OnPlayerLeaveGame(eventNumber: number) {
    
    const p = serverPlayers.get(eventNumber);    
    
    if (p !== undefined) {
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.PlayerDisconnected, p.player));
        p.connected = false;
        const cp = p.getCapturePoint();
        
        if (cp !== null) {
            const capturePoint = serverCapturePoints[mod.GetObjId(cp)];
            capturePoint.removeOnPoint(eventNumber)
            p.setCapturePoint(null);
        }
        
        
       
        if (gameStatus == 3) {
            
            p.addDeath();
            
            disconnectedPlayers.push(p);
            
        }
        
    }
    
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    
    
    if (gameStatus == 0) {
        
        mod.EnableInputRestriction(eventPlayer, mod.RestrictedInputs.FireWeapon, true);   
        
        
    }
    else if (gameStatus == 1) {
        mod.EnableInputRestriction(eventPlayer, mod.RestrictedInputs.FireWeapon, true);
        
    }
    else if (gameStatus == 2) {
        mod.EnableAllInputRestrictions(eventPlayer, true);
        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        
        if (p !== undefined) {
            p.isDeployed = true;
            //mod.SetPlayerIncomingDamageFactor(eventPlayer, .5);
            p.onHQ = true;
        }
    }

    else if (gameStatus == 3) {
        
        mod.EnableAllInputRestrictions(eventPlayer, false);
        mod.EnableInputRestriction(eventPlayer, mod.RestrictedInputs.FireWeapon, false);
        const team = mod.GetTeam(eventPlayer);
    
        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        
        if (p !== undefined) {
            p.isDeployed = true;
            if (p.onHQ) {
                //mod.SetPlayerIncomingDamageFactor(eventPlayer, .5);
            }
            else {
                //mod.SetPlayerIncomingDamageFactor(eventPlayer, 1);
            }
            if (!p.isFirstDeploy()) {
                    if (modlib.Equals(team, team1)) 
                    {
                        serverScores[0] += DEATH_TICKET_LOSS; 
                    }
                    else {
                        serverScores[1] += DEATH_TICKET_LOSS;
                    }
                    return;
                } 
        }
          
    }
    

    
}

export function OnCapturePointCaptured(flag: mod.CapturePoint): void { 
    if (gameStatus == 3) {   
        mod.SetCapturePointNeutralizationTime(flag, NEUTRALIZE_TIME);
        const team = mod.GetCurrentOwnerTeam(flag);

        const symbol = serverCapturePoints[mod.GetObjId(flag)].symbol;
        

        serverPlayers.forEach(p => {
            if (p.flagWidget[symbol] !== null) {
                if (modlib.Equals(team, p.team)) {
                    mod.SetUITextColor(p.flagWidget[symbol], COLOR_FRIENDLY)
                }
                else {
                    mod.SetUITextColor(p.flagWidget[symbol], COLOR_ENEMY)
                }
                
            }
        });
        
        if (modlib.Equals(team, team1)) 
        {
            
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveCaptured], mod.VoiceOverEvents2D.ObjectiveCaptured, voflags[symbol], team1);
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveCapturedEnemy], mod.VoiceOverEvents2D.ObjectiveCapturedEnemy, voflags[symbol], team2);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCaptured, symbol), team1);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturedEnemy, symbol), team2);
        }
        else {
            
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveCaptured], mod.VoiceOverEvents2D.ObjectiveCaptured, voflags[symbol], team2);            
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveCapturedEnemy], mod.VoiceOverEvents2D.ObjectiveCapturedEnemy, voflags[symbol], team1);  
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCaptured, symbol), team2);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturedEnemy, symbol), team1);
        }
    }
}

function OnCapturePointNeutralizing(flag: mod.CapturePoint, team: mod.Team): void {
    if (gameStatus == 3) {
        
        const symbol = serverCapturePoints[mod.GetObjId(flag)].symbol;
        
        
        if (modlib.Equals(team, team1)) {
            
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveNeutralizing, symbol), team1);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveNeutralizingEnemy, symbol), team2);
        }
        else {
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveNeutralizing, symbol), team2);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveNeutralizingEnemy, symbol), team1);
        }
    }
}



export function OnCapturePointLost(flag: mod.CapturePoint): void {
    if (gameStatus == 3) {
        mod.SetCapturePointCapturingTime(flag, CAPTURE_TIME);
        
        const symbol = serverCapturePoints[mod.GetObjId(flag)].symbol;
        serverPlayers.forEach(p => {
            if (p.flagWidget[symbol] !== null) {
                mod.SetUITextColor(p.flagWidget[symbol], COLOR_NEUTRAL)
            }
        });
        

        

        const team = mod.GetPreviousOwnerTeam(flag);

        if (modlib.Equals(team, team1)) {
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveNeutralised], mod.VoiceOverEvents2D.ObjectiveNeutralised, voflags[symbol], team2);
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveLost], mod.VoiceOverEvents2D.ObjectiveNeutralised, voflags[symbol], team1);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveNeutralised, symbol), team1);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveNeutralizedEnemy, symbol), team2);
        }
        else {
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveNeutralised], mod.VoiceOverEvents2D.ObjectiveNeutralised, voflags[symbol], team1);
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveLost], mod.VoiceOverEvents2D.ObjectiveNeutralised, voflags[symbol], team2);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveNeutralised, symbol), team2);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveNeutralizedEnemy, symbol), team1);

        }  
        
        
    } 
    
}

export function OnCapturePointCapturing(flag: mod.CapturePoint) {
    
    if (gameStatus == 3) {
        const cp = serverCapturePoints[mod.GetObjId(flag)];
        const symbol = cp.symbol;

        const team = mod.GetCurrentOwnerTeam(flag);

        if (modlib.Equals(team, team1)) {
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveCapturing], mod.VoiceOverEvents2D.ObjectiveCapturing, voflags[symbol], team2); still bugged
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveContested], mod.VoiceOverEvents2D.ObjectiveContested, voflags[symbol], team1);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturing, symbol), team2);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturingEnemy, symbol), team1);
        }
        else if (modlib.Equals(team, team2)) {
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveCapturing], mod.VoiceOverEvents2D.ObjectiveCapturing, voflags[symbol], team1); still bugged
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveContested], mod.VoiceOverEvents2D.ObjectiveContested, voflags[symbol], team2);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturing, symbol), team1);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturingEnemy, symbol), team2);
        }
        /*
        else {
            setTimeout(() => {
                console.log(cp.getOnPoint()[0] + " " + cp.getOnPoint()[1]);
                if (cp.getOnPoint()[0] > cp.getOnPoint()[1])  {
                    //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveCapturing], mod.VoiceOverEvents2D.ObjectiveCapturing, voflags[symbol], team1); still bugged
                    //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveContested], mod.VoiceOverEvents2D.ObjectiveContested, voflags[symbol], team2);
                    modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturing, symbol), team1);
                    modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturingEnemy, symbol), team2);
                }
                else {
                    //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveCapturing], mod.VoiceOverEvents2D.ObjectiveCapturing, voflags[symbol], team2); still bugged
                    //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveContested], mod.VoiceOverEvents2D.ObjectiveContested, voflags[symbol], team1);
                    modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturing, symbol), team2);
                    modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturingEnemy, symbol), team1);
                }
            }, 100);
            
        }
            */

    }
      
}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {

    if (gameStatus == 0) {
        if (mod.GetObjId(eventInteractPoint) == 2001 || mod.GetObjId(eventInteractPoint) == 2003) {
            mod.UndeployPlayer(eventPlayer);
            const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
            if (modlib.getTeamId(mod.GetTeam(eventPlayer)) == 1 ) {
                mod.SetTeam(eventPlayer, team2);
                
                p?.setTeam();
            }
            else {
                mod.SetTeam(eventPlayer, team1);
                p?.setTeam();
            }
        }

        else if (mod.GetObjId(eventInteractPoint) == 2002 || mod.GetObjId(eventInteractPoint) == 2004) {
            const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
            if (p !== undefined) {
                p.changeReady();
            }
        }
        
    }


    if (gameStatus == 3) {
        if (mod.GetObjId(eventInteractPoint) == 6001) // Spectator
        {
            
            mod.SetCameraTypeForPlayer(eventPlayer, mod.Cameras.Free);

        } 

        if (mod.GetObjId(eventInteractPoint) == 2001 || mod.GetObjId(eventInteractPoint) == 2003) {
            mod.UndeployPlayer(eventPlayer);
            const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
            if (modlib.getTeamId(mod.GetTeam(eventPlayer)) == 1 ) {
                mod.SetTeam(eventPlayer, team2);
                
                p?.setTeam();
            }
            else {
                mod.SetTeam(eventPlayer, team1);
                p?.setTeam();
            }
        }
    }
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    /*
    const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
    
    if (p !== undefined) {
        if (mod.Equals(p.team, team1) && mod.GetObjId(eventAreaTrigger) == 7001) {
            p.onHQ = true;
            if (p.isDeployed) {
                //mod.SetPlayerIncomingDamageFactor(eventPlayer, .5);
            }
            
        }
        else if (mod.Equals(p.team, team2) && mod.GetObjId(eventAreaTrigger) == 7002) {
            p.onHQ = true;
            if (p.isDeployed) {
                //mod.SetPlayerIncomingDamageFactor(eventPlayer, .5);
            }
            
        }
    }*/
}

export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    /*
    const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
    if (p !== undefined) {
        if (mod.Equals(p.team, team1) && mod.GetObjId(eventAreaTrigger) == 7001) {
            p.onHQ = false;
            if (p.isDeployed) {
                //mod.SetPlayerIncomingDamageFactor(eventPlayer, 1);
            }
            //mod.SetPlayerIncomingDamageFactor(eventPlayer, 100);
        }
        else if (mod.Equals(p.team, team2) && mod.GetObjId(eventAreaTrigger) == 7002) {
            if (p.isDeployed) {
                //mod.SetPlayerIncomingDamageFactor(eventPlayer, 1);
            }
        }
    }*/
}

export function OnPlayerEnterCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint) {
    
    if (gameStatus == 3) {
        
        
        const team = mod.GetTeam(eventPlayer);
        const id = modlib.getPlayerId(eventPlayer);
        const cp = serverCapturePoints[mod.GetObjId(eventCapturePoint)];
        
        
        cp.addOnPoint(id);

        const onpoint = cp.getOnPoint();
        const inNeutralizing = ((onpoint[0] == 1 && mod.Equals(cp.getOwner(), team2)) || (onpoint[1] == 1 && mod.Equals(cp.getOwner(), team1))) && cp.getCaptureProgress() == 1;
        if (inNeutralizing) {
            OnCapturePointNeutralizing(eventCapturePoint, team);
        }

        const capturingNeutralByTeam1 = (mod.Equals(cp.getOwner(), teamNeutral) && onpoint[0] == 1 && cp.getCaptureProgress() < 0.02);
        const capturingNeutralByTeam2 = (mod.Equals(cp.getOwner(), teamNeutral) && onpoint[1] == 1 && cp.getCaptureProgress() < 0.02);
        
        if (capturingNeutralByTeam1) {
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveCapturing], mod.VoiceOverEvents2D.ObjectiveCapturing, voflags[symbol], team1); still bugged
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveContested], mod.VoiceOverEvents2D.ObjectiveContested, voflags[symbol], team2);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturing, cp.symbol), team1);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturingEnemy, cp.symbol), team2);
        }
        else if (capturingNeutralByTeam2) {
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveCapturing], mod.VoiceOverEvents2D.ObjectiveCapturing, voflags[symbol], team2); still bugged
            //mod.PlayVO(vo[mod.VoiceOverEvents2D.ObjectiveContested], mod.VoiceOverEvents2D.ObjectiveContested, voflags[symbol], team1);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturing, cp.symbol), team2);
            modlib.ShowHighlightedGameModeMessage(mod.Message(mod.stringkeys.ObjectiveCapturingEnemy, cp.symbol), team1);
        }
        
        const parent = mod.FindUIWidgetWithName("ActiveFlagContainer");
        mod.AddUIText(
            "ActiveFlag" + id,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(60, 60, 0),
            mod.UIAnchor.Center,
            parent,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0.4,
            mod.UIBgFill.Blur,
            mod.Message(cp.symbol),
            34,
            COLOR_NEUTRAL,
            1,
            mod.UIAnchor.Center,
            eventPlayer            
        )
        let t:number[];
        
        if (modlib.Equals(team, team1)) {
            t = [0, 1];
            
        }
        else {
            t = [1, 0];
            
        }

        mod.AddUIText(
            "FriendlyCap" + id,
            mod.CreateVector(-80, 0, 0),
            mod.CreateVector(40, 40, 0),
            mod.UIAnchor.Center,
            parent,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0.2,
            mod.UIBgFill.Blur,
            mod.Message(cp.getOnPoint()[t[0]]),
            20,
            COLOR_FRIENDLY,
            1,
            mod.UIAnchor.Center,
            eventPlayer            
        )

        mod.AddUIText(
            "EnemyCap" + id,
            mod.CreateVector(80, 0, 0),
            mod.CreateVector(40, 40, 0),
            mod.UIAnchor.Center,
            parent,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0.2,
            mod.UIBgFill.Blur,
            mod.Message(cp.getOnPoint()[t[1]]),
            20,
            COLOR_ENEMY,
            1,
            mod.UIAnchor.Center,
            eventPlayer            
        )

        let color:mod.Vector;
        if (modlib.Equals(cp.getOwner(), team)) {
                color = COLOR_FRIENDLY;
            }
            else if (modlib.Equals(cp.getOwner(), teamNeutral)) {
                if (modlib.Equals(cp.getCapturingTeam(), team)) {
                    color =  COLOR_FRIENDLY;
                }
                else {
                    color =  COLOR_ENEMY;
                }
            }
            else {
                color = COLOR_ENEMY;
            }

        mod.AddUIContainer(
            "CapProgress" + id,
            mod.CreateVector(60, 0, 0),
            mod.CreateVector(60*cp.getCaptureProgress(), 60, 0),
            mod.UIAnchor.CenterLeft,
            parent,
            true,
            0,
            color,
            0.4,
            mod.UIBgFill.Solid,
            eventPlayer
        )

        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        if (p !== undefined) {
            p.setCapturePoint(eventCapturePoint);
            
            p.setWidgets();
        }
        
        
    }
    
}

export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint) {
    if (gameStatus == 3) {
        
        const cp = serverCapturePoints[mod.GetObjId(eventCapturePoint)];
        cp.removeOnPoint(modlib.getPlayerId(eventPlayer));
        const onpoint = cp.getOnPoint();
        const team = mod.GetTeam(eventPlayer);
        const inNeutralizing = ((onpoint[0] == 1 && mod.Equals(cp.getOwner(), team2)) || (onpoint[1] == 1 && mod.Equals(cp.getOwner(), team1))) && cp.getCaptureProgress() == 1;
        if (inNeutralizing) {
            OnCapturePointNeutralizing(eventCapturePoint, team);
        }
        
        const id = modlib.getPlayerId(eventPlayer);
        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        if (p !== undefined) {
            p.setCapturePoint(null);
        }

        mod.DeleteUIWidget(mod.FindUIWidgetWithName("ActiveFlag" + id));
        mod.DeleteUIWidget(mod.FindUIWidgetWithName("FriendlyCap" + id));
        mod.DeleteUIWidget(mod.FindUIWidgetWithName("EnemyCap" + id));
        mod.DeleteUIWidget(mod.FindUIWidgetWithName("CapProgress" + id));
        
    }
}

export function OnPlayerEarnedKill(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, eventDeathType: mod.DeathType, eventWeaponUnlock: mod.WeaponUnlock) {
    if (gameStatus == 3) {
        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        if (p !== undefined) {
            if (mod.NotEqualTo(eventPlayer, eventOtherPlayer)) {
                    p.addKill();
                    p.addScore(100);
                }
        }
            
    }
}

export function OnPlayerUndeploy(eventPlayer: mod.Player) {
    if (gameStatus == 3) {
        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        if (p !== undefined) {
            p.isDeployed = false;
            p.addDeath();
        }
           
    }
}

export function OnPlayerEarnedKillAssist(eventPlayer: mod.Player, eventOtherPlayer: mod.Player) {
    if (gameStatus == 3) {
        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        if (p !== undefined) {
            p.addKillAssist();
            p.addScore(50);
        }
    }
    
}



