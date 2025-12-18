// === ConquestSmall.ts ===
// Conquest Small mode with 3 flags, ticket bleed and UI tracking
import * as modlib from 'modlib';


const VERSION = [1, 5, 0];

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

const REDEPLOY_TIME = 10;
const TICK_RATE = 30;
const TOTAL_TICKS = ROUND_TIME * TICK_RATE;

// Enums
enum CapturePointStatus {
    Stable = 0,
    Capturing,
    PassiveCapturing,
    Neutralizing,
    PassiveNeutralizing,
    Contested
}



// Define Classes
class Player {
    public player: mod.Player;
    public friendlyCapWidget: mod.UIWidget;
    public enemyCapWidget: mod.UIWidget;
    public progressBarWidget: mod.UIWidget;
    public friendlyScoreWidget: mod.UIWidget;
    public opponentScoreWidget: mod.UIWidget;
    public flagWidget: {[key: string]: mod.UIWidget};
    public activeFlagContainerWidget: mod.UIWidget;
    public activeFlagFriendlyWidget: mod.UIWidget;
    public activeFlagEnemyWidget: mod.UIWidget;
    public activeFlagWidget: mod.UIWidget;
    public isDeployed: boolean;
    
    
    private _scoreboard: number[];
    private _onCapturePoint: mod.CapturePoint | null;
    private _firstDeploy:boolean;
    private _ready: boolean;
    public id: number;
    public team: mod.Team;

    constructor(player: mod.Player) {
        this.player = player;
        this._scoreboard = [0,0,0,0,0];
        this._onCapturePoint = null;
        this._firstDeploy = true;
        this._ready = false; //_ready
        this.id = modlib.getPlayerId(this.player);
        this.isDeployed = false;
        
        
        this.team = mod.GetTeam(this.player);
        console.log(modlib.getTeamId(this.team));
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
            mod.Message(INITIAL_TICKETS),
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
            mod.Message(INITIAL_TICKETS),
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
            COLOR_NEUTRAL,
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
            COLOR_NEUTRAL,
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
            COLOR_NEUTRAL,
            1,
            mod.UIAnchor.Center,
            this.player            
        )

        this.flagWidget = {
            'A': mod.FindUIWidgetWithName("FLAGA"+this.id),
            'B': mod.FindUIWidgetWithName("FLAGB"+this.id),            
            'C': mod.FindUIWidgetWithName("FLAGC"+this.id)
        };

        mod.AddUIContainer(

            "ActiveFlagContainer"+this.id,
            mod.CreateVector(0, 120, 0),
            mod.CreateVector(180, 80, 0),
            mod.UIAnchor.TopCenter,
            mod.FindUIWidgetWithName("LiveContainer"),
            false,
            0,
            mod.CreateVector(0.0314, 0.0431, 0.0431),
            0.4,
            mod.UIBgFill.None,
            this.player            
        )

        const parent = mod.FindUIWidgetWithName("ActiveFlagContainer"+this.id);

        mod.AddUIText(
            "ActiveFlag" + this.id,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(60, 60, 0),
            mod.UIAnchor.Center,
            parent,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0.4,
            mod.UIBgFill.Blur,
            mod.Message(0),
            34,
            COLOR_NEUTRAL,
            1,
            mod.UIAnchor.Center,
            this.player            
        )
        

        mod.AddUIText(
            "FriendlyCap" + this.id,
            mod.CreateVector(-80, 0, 0),
            mod.CreateVector(40, 40, 0),
            mod.UIAnchor.Center,
            parent,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0.2,
            mod.UIBgFill.Blur,
            mod.Message(0),
            20,
            COLOR_FRIENDLY,
            1,
            mod.UIAnchor.Center,
            this.player            
        )

        mod.AddUIText(
            "EnemyCap" + this.id,
            mod.CreateVector(80, 0, 0),
            mod.CreateVector(40, 40, 0),
            mod.UIAnchor.Center,
            parent,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0.2,
            mod.UIBgFill.Blur,
            mod.Message(0),
            20,
            COLOR_ENEMY,
            1,
            mod.UIAnchor.Center,
            this.player            
        )

        mod.AddUIContainer(
            "CapProgress" + this.id,
            mod.CreateVector(60, 0, 0),
            mod.CreateVector(0, 60, 0),
            mod.UIAnchor.CenterLeft,
            parent,
            true,
            0,
            mod.CreateVector(1, 1, 1),
            0.4,
            mod.UIBgFill.Solid,
            this.player
        )
        this.friendlyCapWidget = mod.FindUIWidgetWithName("FriendlyCap" + this.id);
        this.enemyCapWidget = mod.FindUIWidgetWithName("EnemyCap" + this.id);
        
        this.friendlyScoreWidget = mod.FindUIWidgetWithName("TeamFriendlyScore"+this.id);
        this.opponentScoreWidget = mod.FindUIWidgetWithName("TeamOpponentScore"+this.id);
        this.activeFlagContainerWidget = parent;
        this.activeFlagFriendlyWidget = mod.FindUIWidgetWithName("FriendlyCap" + this.id);
        this.activeFlagEnemyWidget = mod.FindUIWidgetWithName("EnemyCap" + this.id);
        this.activeFlagWidget = mod.FindUIWidgetWithName("ActiveFlag" + this.id);
        this.progressBarWidget = mod.FindUIWidgetWithName("CapProgress" + this.id);

        mod.SetRedeployTime(this.player, 0);
    }

    setCapturePoint(capturePoint: mod.CapturePoint | null) {
        this._onCapturePoint = capturePoint;
    }

    getCapturePoint(): mod.CapturePoint | null {
        return this._onCapturePoint;
    }

    isFirstDeploy() {
        if (this._firstDeploy) {
            this._firstDeploy = false;
            return true;
        }
        else {
            return false;
        }
           
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
                mod.Message(INITIAL_TICKETS),
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
                mod.Message(INITIAL_TICKETS),
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

            mod.AddUIContainer(

                "ActiveFlagContainer"+this.id,
                mod.CreateVector(0, 120, 0),
                mod.CreateVector(180, 80, 0),
                mod.UIAnchor.TopCenter,
                mod.FindUIWidgetWithName("LiveContainer"),
                false,
                0,
                mod.CreateVector(0.0314, 0.0431, 0.0431),
                0.4,
                mod.UIBgFill.None,
                this.player            
            )

            const parent = mod.FindUIWidgetWithName("ActiveFlagContainer"+this.id);

            mod.AddUIText(
                "ActiveFlag" + this.id,
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(60, 60, 0),
                mod.UIAnchor.Center,
                parent,
                true,
                0,
                mod.CreateVector(0, 0, 0),
                0.4,
                mod.UIBgFill.Blur,
                mod.Message(0),
                34,
                COLOR_NEUTRAL,
                1,
                mod.UIAnchor.Center,
                this.player            
            )
            

            mod.AddUIText(
                "FriendlyCap" + this.id,
                mod.CreateVector(-80, 0, 0),
                mod.CreateVector(40, 40, 0),
                mod.UIAnchor.Center,
                parent,
                true,
                0,
                mod.CreateVector(0, 0, 0),
                0.2,
                mod.UIBgFill.Blur,
                mod.Message(0),
                20,
                COLOR_FRIENDLY,
                1,
                mod.UIAnchor.Center,
                this.player            
            )

            mod.AddUIText(
                "EnemyCap" + this.id,
                mod.CreateVector(80, 0, 0),
                mod.CreateVector(40, 40, 0),
                mod.UIAnchor.Center,
                parent,
                true,
                0,
                mod.CreateVector(0, 0, 0),
                0.2,
                mod.UIBgFill.Blur,
                mod.Message(0),
                20,
                COLOR_ENEMY,
                1,
                mod.UIAnchor.Center,
                this.player            
            )

            mod.AddUIContainer(
                "CapProgress" + this.id,
                mod.CreateVector(60, 0, 0),
                mod.CreateVector(0, 60, 0),
                mod.UIAnchor.CenterLeft,
                parent,
                true,
                0,
                mod.CreateVector(1, 1, 1),
                0.4,
                mod.UIBgFill.Solid,
                this.player
            )

            this.flagWidget['A'] = mod.FindUIWidgetWithName("FLAGA"+this.id);
            this.flagWidget['B'] = mod.FindUIWidgetWithName("FLAGB"+this.id);
            this.flagWidget['C'] = mod.FindUIWidgetWithName("FLAGC"+this.id);
            this.friendlyScoreWidget = mod.FindUIWidgetWithName("TeamFriendlyScore"+this.id);
            this.opponentScoreWidget = mod.FindUIWidgetWithName("TeamOpponentScore"+this.id);
            this.activeFlagContainerWidget = parent;
            this.activeFlagFriendlyWidget = mod.FindUIWidgetWithName("FriendlyCap" + this.id);
            this.activeFlagEnemyWidget = mod.FindUIWidgetWithName("EnemyCap" + this.id);
            this.activeFlagWidget = mod.FindUIWidgetWithName("ActiveFlag" + this.id);
            this.progressBarWidget = mod.FindUIWidgetWithName("CapProgress" + this.id);
        }

        
    }

    addFlagUI() {
        
    }

    updateTickets() {
        mod.SetUITextLabel(this.friendlyScoreWidget, mod.Message(getFriendlyScore(this.team)));
        mod.SetUITextLabel(this.opponentScoreWidget, mod.Message(getOpponentScore(this.team)));
    }

    updateUIPlayersOnPoint() {
        const point = this.getCapturePoint();
        
        if (point) {
            const cp = serverCapturePoints[mod.GetObjId(point)];
            const team = this.team;
            
            if (modlib.Equals(team, team1)) {
                mod.SetUITextLabel(this.friendlyCapWidget, mod.Message(cp.getOnPoint()[0]));
                mod.SetUITextLabel(this.enemyCapWidget, mod.Message(cp.getOnPoint()[1]));
            }
            else {
                mod.SetUITextLabel(this.friendlyCapWidget, mod.Message(cp.getOnPoint()[1]));
                mod.SetUITextLabel(this.enemyCapWidget, mod.Message(cp.getOnPoint()[0]));
            }
        }
    }

    updateUIProgressColor() {
        const point = this.getCapturePoint();
        
        if (point) {
            
            const cp = serverCapturePoints[mod.GetObjId(point)];
            if (this.progressBarWidget) {
                
                if (modlib.Equals(cp.getOwner(), this.team)) {
                    mod.SetUIWidgetBgColor(this.progressBarWidget, COLOR_FRIENDLY);
                }
                else if (modlib.Equals(cp.getOwner(), teamNeutral)) {
                    if (modlib.Equals(cp.getCapturingTeam(), this.team)) {
                        mod.SetUIWidgetBgColor(this.progressBarWidget, COLOR_FRIENDLY);
                    }
                    else {
                        mod.SetUIWidgetBgColor(this.progressBarWidget, COLOR_ENEMY);
                    }
                }
                else {
                    mod.SetUIWidgetBgColor(this.progressBarWidget, COLOR_ENEMY);
                }
                
            }
        }
    }

    updateUIProgress() {
        const point = this.getCapturePoint();
        
        if (point) {
            const cp = serverCapturePoints[mod.GetObjId(point)];
            const size = mod.CreateVector(mod.Ceiling(60 * cp.getCaptureProgress()),60,0);
            
            //const size = mod.CreateVector(32,60,0);
                
            if (this.progressBarWidget) {
                mod.SetUIWidgetSize(this.progressBarWidget, size);
            }
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
    private _status: CapturePointStatus;
    private _isFlashing: boolean;


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
        mod.EnableGameModeObjective(this.capturePoint, false);
        this._status = CapturePointStatus.Stable;
        this._isFlashing = false;

    }

    statusChanged() {
        console.log("Status changed");
        if (this._status == CapturePointStatus.Stable) {
            mod.SetCapturePointCapturingTime(this.capturePoint, CAPTURE_TIME);
            this.stopFlashingFlag();
            this._isFlashing = false;
        }
        else if (this._status == CapturePointStatus.Capturing) {
            this._isFlashing = true;
            mod.SetCapturePointCapturingTime(this.capturePoint, CAPTURE_TIME); 
        }
        else if (this._status == CapturePointStatus.Neutralizing) {
            mod.SetCapturePointNeutralizationTime(this.capturePoint, NEUTRALIZE_TIME);
            if (mod.Equals(this._capturingTeam, teamNeutral)) {
                this._isFlashing = false;
                this.stopFlashingFlag();
            }
        }
        else if (this._status == CapturePointStatus.Contested) {
            this._isFlashing = true;
            
        }
        
        
        this.updateUIProgressColorForPlayersOnPoint();
    }

    setStatus(status: CapturePointStatus) {
        // mod.DisplayHighlightedWorldLogMessage(mod.Message(status));
        this._status = status;
    }

    getStatus(): CapturePointStatus {
        return this._status;
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

    

    getOwner(): mod.Team {
        return mod.GetCurrentOwnerTeam(this.capturePoint);
    }

    flashFlag() {
        if (this._isFlashing) {
            this._fade += 2* mod.Pi() / TICK_RATE;
            serverPlayers.forEach(p => {
                mod.SetUITextAlpha(mod.FindUIWidgetWithName("FLAG" + this.symbol + p.id), (mod.SineFromRadians(this._fade) + 1) / 2);
            });
        }
    }

    stopFlashingFlag() {
        serverPlayers.forEach(p => {
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("FLAG" + this.symbol + p.id), 1);
        });
    }

    getCaptureProgress(): number {
        return mod.GetCaptureProgress(this.capturePoint);
    }

    setCaptureProgress(progress: number) {
        this._captureProgress = progress;
    }

    getCapturingTeam(): mod.Team {
        return this._capturingTeam;
    }

    setCapturingTeam(team: mod.Team) {
        this._capturingTeam = team;
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

    updateUIforPlayersOnPoint() {
        this._onPoint.forEach(id => {
            const p = serverPlayers.get(id);
            if(p) {
                p.updateUIPlayersOnPoint();
            }
            
        });
    }

    updateUIProgressForPlayersOnPoint() {
        if (this._status == CapturePointStatus.Stable || this._status == CapturePointStatus.Contested) {
            return;
        }
        this._onPoint.forEach(id => {
            const p = serverPlayers.get(id);
            if(p) {
                p.updateUIProgress()
            }
            
        });
    }
    
    updateUIProgressColorForPlayersOnPoint() {
        this._onPoint.forEach(id => {
            const p = serverPlayers.get(id);
            if(p) {
                p.updateUIProgressColor();
            }
            
        });
    }
}




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

const VOs: mod.VO[] = [];

let voObject: mod.VO;

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
                textLabel: mod.Message(mod.stringkeys.RemainingTime, 20, 0, 0),
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
                textLabel: mod.Message(mod.stringkeys.PreMatchTeam1, 0, 0),
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
                textLabel: mod.Message(mod.stringkeys.PreMatchTeam2, 0, 0),
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

function CountReadyPlayers() {
    // Check if all players are ready
    let readyPlayers:number[] = [0, 0];
    let totalPlayers:number[] = [0, 0];
    serverPlayers.forEach(player => {
        player.setTeam();
        if (mod.Equals(player.team, team1)) {
            totalPlayers[0] += 1;
            if (player.isReady()) {
                readyPlayers[0] += 1;
            } 

        } else if (mod.Equals(player.team, team2)) {
            totalPlayers[1] += 1;
            if (player.isReady()) {
                readyPlayers[1] += 1;
            }
            
        }
    })
    
    mod.SetUITextLabel(mod.FindUIWidgetWithName("PreMatchTeam1"), mod.Message("{}/{}", readyPlayers[0], totalPlayers[0]));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("PreMatchTeam2"), mod.Message("{}/{}", readyPlayers[1], totalPlayers[1]));
    if (readyPlayers[0] == totalPlayers[0] && readyPlayers[1] == totalPlayers[1] && (readyPlayers[0] > 0 || readyPlayers[1] > 0)) {
        gameStatus = 1;            
    }
}


function SetUITime() {
    const timeWidget = mod.FindUIWidgetWithName("RemainingTime");
    const remainingTime = ROUND_TIME - phaseTickCount / TICK_RATE;
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
    mod.SetGameModeTimeLimit(60000);
    
    Object.values(serverCapturePoints).forEach(cp => {
        mod.EnableGameModeObjective(cp.capturePoint, false);
    })

    CountReadyPlayers();
    

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
    mod.EnableWorldIconText(mod.GetWorldIcon(5011), false);
    mod.EnableWorldIconText(mod.GetWorldIcon(5012), false);
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
        mod.SetCapturePointCapturingTime(capturePoint.capturePoint, CAPTURE_TIME);
        //mod.SetCapturePointNeutralizationTime(capturePoint.capturePoint, NEUTRALIZE_TIME);     
    });

    
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
    initialization[2] = true;
}

// === GAME STARTUP ===
function InitializeLive() {
    console.log("Initialize Live");
    phaseTickCount = 0;
    
    mod.SetUIWidgetVisible(UIContainers[1], false);
    mod.SetUIWidgetVisible(UIContainers[2], true);

    serverPlayers.forEach(p => {
        try {
            p.setTeam();
            mod.SetRedeployTime(p.player, REDEPLOY_TIME);
            
            if (p.isDeployed) {
                p.isFirstDeploy();
                mod.EnableAllInputRestrictions(p.player, false);
                mod.EnableInputRestriction(p.player, mod.RestrictedInputs.FireWeapon, false);
            }
        } catch (e) {
            console.log(e);
        }
        
    })
    serverScores = [INITIAL_TICKETS, INITIAL_TICKETS];
    
    mod.SetScoreboardColumnNames(mod.Message(mod.stringkeys.ScoreboardScore), mod.Message(mod.stringkeys.ScoreboardKills), 
    mod.Message(mod.stringkeys.ScoreboardDeaths), mod.Message(mod.stringkeys.ScoreboardAssists), mod.Message(mod.stringkeys.ScoreboardCaptures));
    

    SetUITime();
    SetUIScores();
    //mod.ResetGameModeTime();
    //mod.SetGameModeTimeLimit(ROUND_TIME);
    initialization[3] = true;
    //VOs.push(mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0)));
    //VOs.push(mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0)));
    //voObject = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
        
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
            capturePoint.updateUIProgressForPlayersOnPoint();  
            capturePoint.flashFlag();
        
        });

        if (phaseTickCount == TOTAL_TICKS) {
            console.log("Live ends by time.");
            gameStatus = 4;
            //mod.PauseGameModeTime(true);
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



export function OnPlayerJoinGame(eventPlayer: mod.Player) {
    // If player was disconnected or not
    let player;
    let disconnected = false;
    
    disconnectedPlayers.forEach((p) => {
        if (mod.Equals(p.player, eventPlayer)) {
            // Player reconnected
            mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.PlayerReconnected, eventPlayer, p.id));
            p.setTeam();
            serverPlayers.set(p.id, p);
            player = p;
            disconnectedPlayers.splice(disconnectedPlayers.indexOf(p), 1);
            disconnected = true;
        }
    })
    
    if (!disconnected) {
        // New player
        const newPlayer = new Player(eventPlayer);
        serverPlayers.set(newPlayer.id, newPlayer);
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.PlayerJoined, eventPlayer, newPlayer.id));
        console.log(`Player with ID${newPlayer.id} joined server`);
        player = newPlayer;
    }


    if (gameStatus == 0 || gameStatus == -1) {
            mod.AddUIText(
                "ReadyText" + player?.id,
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
           
        }
}

export function OnPlayerLeaveGame(eventNumber: number) {
    const p = serverPlayers.get(eventNumber);    
    
    if (p) {
        console.log(`Player with ID${p.player} disconnected`);
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.PlayerDisconnected, p.id));
        
        
        disconnectedPlayers.push(p);
        serverPlayers.delete(eventNumber);
       
        if (gameStatus == 3) {
            p.addDeath();
            const cp = p.getCapturePoint();
            if (cp) {
                const capturePoint = serverCapturePoints[mod.GetObjId(cp)];
                capturePoint.removeOnPoint(eventNumber);
                console.log(capturePoint.getOnPoint()[0] + capturePoint.getOnPoint()[1]);
                console.log(modlib.ConvertArray(mod.GetPlayersOnPoint(cp)).length);
                //mod.DisplayHighlightedWorldLogMessage(mod.Message(modlib.ConvertArray(mod.GetPlayersOnPoint(cp)).length));
                p.setCapturePoint(null);
            }
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
        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        if (p) {
            p.isDeployed = true;
        }
    
        mod.EnableAllInputRestrictions(eventPlayer, true);
    }

    else if (gameStatus == 3) {
        const team = mod.GetTeam(eventPlayer);
        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        if (p) {
           p.isDeployed = true;
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
            else {
                mod.EnableAllInputRestrictions(eventPlayer, false);
                mod.EnableInputRestriction(eventPlayer, mod.RestrictedInputs.FireWeapon, false);
            }
        }
    }
}

export function OnCapturePointCaptured(flag: mod.CapturePoint): void { 
    if (gameStatus == 3) {   

        
        //mod.SetCapturePointNeutralizationTime(flag, NEUTRALIZE_TIME);
        const team = mod.GetCurrentOwnerTeam(flag);
        const cp = serverCapturePoints[mod.GetObjId(flag)];
        const symbol = cp.symbol;
        //cp.setStatus(CapturePointStatus.Stable);
        
        serverPlayers.forEach(p => {
            if (p.flagWidget[symbol]) {
                if (modlib.Equals(team, p.team)) {
                    mod.SetUITextColor(p.flagWidget[symbol], COLOR_FRIENDLY)
                }
                else {
                    mod.SetUITextColor(p.flagWidget[symbol], COLOR_ENEMY)
                }
                
            }
        });
        /*
        const vo1 = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
        const vo2 = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
        if (modlib.Equals(team, team1)) 
        {
            
            mod.PlayVO(vo1, mod.VoiceOverEvents2D.ObjectiveCaptured,mod.VoiceOverFlags.Alpha, team1);            
            mod.PlayVO(vo2, mod.VoiceOverEvents2D.ObjectiveCapturedEnemy, voflags[symbol], team2);
            
        }
        else {
            mod.PlayVO(vo1, mod.VoiceOverEvents2D.ObjectiveCaptured,voflags[symbol], team2);            
            mod.PlayVO(vo2, mod.VoiceOverEvents2D.ObjectiveCapturedEnemy, voflags[symbol], team1);
        }  
        mod.UnspawnObject(vo1);
        mod.UnspawnObject(vo2);
        */
    }
}
/*
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

*/

export function OnCapturePointLost(flag: mod.CapturePoint): void {
    console.log("Lost");
    if (gameStatus == 3) {
        
        const cp = serverCapturePoints[mod.GetObjId(flag)];
        //cp.statusChanged();
        
        const symbol = cp.symbol;
        serverPlayers.forEach(p => {
            if (p.flagWidget[symbol]) {
                mod.SetUITextColor(p.flagWidget[symbol], COLOR_NEUTRAL)
            }
            
        });
        /*
        const team = mod.GetPreviousOwnerTeam(flag);
        const vo1 = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
        const vo2 = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
        if (modlib.Equals(team, team1)) 
        {
            
            mod.PlayVO(vo1, mod.VoiceOverEvents2D.ObjectiveNeutralised,voflags[symbol], team1);            
            mod.PlayVO(vo2, mod.VoiceOverEvents2D.ObjectiveLost, voflags[symbol], team2);
            
        }
        else {
            mod.PlayVO(vo1, mod.VoiceOverEvents2D.ObjectiveNeutralised,voflags[symbol], team2);            
            mod.PlayVO(vo2, mod.VoiceOverEvents2D.ObjectiveLost, voflags[symbol], team1);
        }  
        mod.UnspawnObject(vo1);
        mod.UnspawnObject(vo2);
        */
        
    } 
    
}

export async function OnCapturePointCapturing(flag: mod.CapturePoint) {
    
    if (gameStatus == 3) {
        console.log("Capturing");
        const cp = serverCapturePoints[mod.GetObjId(flag)];
        const symbol = cp.symbol;
        cp.updateUIProgressColorForPlayersOnPoint();
        /*
        const team = mod.GetCurrentOwnerTeam(flag);

        
        mod.PlayVO(voObject, mod.VoiceOverEvents2D.ObjectiveCapturing, mod.VoiceOverFlags.Delta, team1);
        if (modlib.Equals(team, team1)) 
        {
            
            //mod.PlayVO(VOs[0], mod.VoiceOverEvents2D.ObjectiveCapturing, mod.VoiceOverFlags.Alpha, team1);            
            //mod.PlayVO(vo2, mod.VoiceOverEvents2D.ObjectiveContested, voflags[symbol], team2);
            
        }
        else {
            //mod.PlayVO(vo1, mod.VoiceOverEvents2D.ObjectiveCapturing, voflags[symbol], team2);            
            //mod.PlayVO(vo2, mod.VoiceOverEvents2D.ObjectiveContested, voflags[symbol], team1);

        }
        //mod.UnspawnObject(vo1);
        //mod.UnspawnObject(vo2);
        */
    }
      
}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
    if (gameStatus == 0) {
        
        if (p) {
            if ((mod.GetObjId(eventInteractPoint) == 2001 || mod.GetObjId(eventInteractPoint) == 2003)) {
                if (p.isReady())
                {
                    modlib.ShowNotificationMessage(mod.Message(mod.stringkeys.CannotChangeTeamWhenReady), eventPlayer);
                    return;
                }

                mod.UndeployPlayer(eventPlayer);
                
                if (modlib.getTeamId(mod.GetTeam(eventPlayer)) == 1 ) {
                    try {
                        mod.SetTeam(eventPlayer, team2); 
                    } catch (e) {
                        console.log(e);
                    }
                    
                    
                }
                else {
                    try {
                        mod.SetTeam(eventPlayer, team1);                
                    } catch (e) {
                        console.log(e);
                    }
                    
                }
                p.setTeam();
            }

            else if (mod.GetObjId(eventInteractPoint) == 2002 || mod.GetObjId(eventInteractPoint) == 2004) {
                p.changeReady();
            }
        }

        CountReadyPlayers();  
        
        
    }


    if (gameStatus == 3) {
        if (mod.GetObjId(eventInteractPoint) == 6001) // Spectator
        {
            //mod.SetCameraTypeForPlayer(eventPlayer, mod.Cameras.Free);
        } 

        if (mod.GetObjId(eventInteractPoint) == 2001 || mod.GetObjId(eventInteractPoint) == 2003) {
            const team = mod.GetTeam(eventPlayer);
            const team1numPlayers = modlib.getPlayersInTeam(team1).length;
            const team2numPlayers = modlib.getPlayersInTeam(team2).length;
            if (mod.Equals(team, team1)) {
                if (team1numPlayers > team2numPlayers) {
                    mod.UndeployPlayer(eventPlayer);
                    try {
                        mod.SetTeam(eventPlayer, team2);
                    } catch (e) {
                        console.log(e);
                    }
                    Object.values(serverCapturePoints).forEach(cp => {
                        if (modlib.Equals(cp.getOwner(), team2)) {
                            if (p?.flagWidget[cp.symbol]) {
                                mod.SetUITextColor(p?.flagWidget[cp.symbol], COLOR_FRIENDLY);
                            }                        
                        }
                        else if (modlib.Equals(cp.getOwner(), team1)) {
                            if (p?.flagWidget[cp.symbol]) {
                                mod.SetUITextColor(p?.flagWidget[cp.symbol], COLOR_ENEMY);
                            }
                        }
                    })
                    
                }
            }
            else if (mod.Equals(team, team2)) {
                if (team2numPlayers > team1numPlayers) {
                    mod.UndeployPlayer(eventPlayer);
                    try {
                        mod.SetTeam(eventPlayer, team1); 
                    } catch (e) {
                        console.log(e);
                    }
                    Object.values(serverCapturePoints).forEach(cp => {
                        if (modlib.Equals(cp.getOwner(), team1)) {
                            if (p?.flagWidget[cp.symbol]) {
                                mod.SetUITextColor(p?.flagWidget[cp.symbol], COLOR_FRIENDLY);
                            }                        
                        }
                        else if (modlib.Equals(cp.getOwner(), team2)) {
                            if (p?.flagWidget[cp.symbol]) {
                                mod.SetUITextColor(p?.flagWidget[cp.symbol], COLOR_ENEMY);
                            }
                        }
                    })
                }
                
            }

                       
            p?.setTeam();

            
        }
    }
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (gameStatus == 2 || gameStatus == 3) {
        const team = mod.GetTeam(eventPlayer);
        
        if (mod.Equals(team, team1) && mod.GetObjId(eventAreaTrigger) == 7001) {
            //mod.SetPlayerIncomingDamageFactor(eventPlayer, .5);
            console.log("Setting damage factor to 0.5");
            
        }
        else if (mod.Equals(team, team2) && mod.GetObjId(eventAreaTrigger) == 7002) {
            //mod.SetPlayerIncomingDamageFactor(eventPlayer, .5);
            console.log("Setting damage factor to 0.5");
            
        }
        
    }
}

export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (gameStatus == 2 || gameStatus == 3) {
        const team = mod.GetTeam(eventPlayer);
        if (mod.Equals(team, team1) && mod.GetObjId(eventAreaTrigger) == 7001) {
            //mod.SetPlayerIncomingDamageFactor(eventPlayer, 1);
            console.log("Setting damage factor to 1");
            //mod.DisplayHighlightedWorldLogMessage(mod.Message(1))
        }
        else if (mod.Equals(team, team2) && mod.GetObjId(eventAreaTrigger) == 7002) {
            //mod.SetPlayerIncomingDamageFactor(eventPlayer, 1);
            console.log("Setting damage factor to 1");
            //mod.DisplayHighlightedWorldLogMessage(mod.Message(1))
        }
        
        
    }
    
}



export function OnPlayerEnterCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint) {
    
    if (gameStatus == 3) {
        
        
        const team = mod.GetTeam(eventPlayer);
        const id = modlib.getPlayerId(eventPlayer);
        const cp = serverCapturePoints[mod.GetObjId(eventCapturePoint)];
        const player = serverPlayers.get(id);


        
        cp.addOnPoint(id);
        if (player) {
            player.setCapturePoint(cp.capturePoint);
        }
        

        const onpoint = cp.getOnPoint();
        const previousCapturePointStatus = cp.getStatus();

        if (onpoint[0] > onpoint[1]) {
            if (mod.Equals(cp.getOwner(), team1)) {
                if (cp.getCaptureProgress() == 1) {
                    cp.setStatus(CapturePointStatus.Stable);
                }
                else {
                    cp.setStatus(CapturePointStatus.Capturing);
                    cp.setCapturingTeam(team1);
                }
                
            }
            else if (mod.Equals(cp.getOwner(), team2)) {
                cp.setStatus(CapturePointStatus.Neutralizing);
                cp.setCapturingTeam(team1);
            }
            else {
                cp.setStatus(CapturePointStatus.Capturing);
                cp.setCapturingTeam(team1);
            }
        }
        else if (onpoint[0] < onpoint[1]) {
            if (mod.Equals(cp.getOwner(), team2)) {
                if (cp.getCaptureProgress() == 1) {
                    cp.setStatus(CapturePointStatus.Stable);
                }
                else {
                    cp.setStatus(CapturePointStatus.Capturing);
                    cp.setCapturingTeam(team2);
                }
                
            }
            else if (mod.Equals(cp.getOwner(), team1)) {
                cp.setStatus(CapturePointStatus.Neutralizing);
                cp.setCapturingTeam(team2);
            }
            else {
                cp.setStatus(CapturePointStatus.Capturing);
                cp.setCapturingTeam(team2);
            }
        }
        else {
            cp.setStatus(CapturePointStatus.Contested);            
        }

        if (cp.getStatus() != previousCapturePointStatus) {
            
            cp.statusChanged();
        }

        /*
        if (cp.getStatus() == CapturePointStatus.Neutralizing) {
            OnCapturePointNeutralizing(eventCapturePoint, cp.getCapturingTeam());
        }

        */
        
        
        console.log("Adding flag UI")

        if (player) {
            let t:number[];
            if (modlib.Equals(team, team1)) {
                t = [0, 1];
            }
            else {
                t = [1, 0];
            }
            
            mod.SetUITextLabel(player.activeFlagWidget, mod.Message(cp.symbol));
            mod.SetUITextLabel(player.activeFlagFriendlyWidget, mod.Message(cp.getOnPoint()[t[0]]));
            mod.SetUITextLabel(player.activeFlagEnemyWidget, mod.Message(cp.getOnPoint()[t[1]]));
            mod.SetUIWidgetVisible(player.activeFlagContainerWidget, true);
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
            
            player.setCapturePoint(eventCapturePoint);            
            
        }
        
        cp.updateUIforPlayersOnPoint();
        
    }
    
}

export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint) {
    
    if (gameStatus == 3) {
        console.log("Player left capture point");
        const cp = serverCapturePoints[mod.GetObjId(eventCapturePoint)];
        cp.removeOnPoint(modlib.getPlayerId(eventPlayer));
        const onpoint = cp.getOnPoint();
        const previousCapturePointStatus = cp.getStatus();
        if (onpoint[0] > onpoint[1]) {
            if (mod.Equals(cp.getOwner(), team1)) {
                if (cp.getCaptureProgress() == 1) {
                    cp.setStatus(CapturePointStatus.Stable);
                }
                else {
                    cp.setStatus(CapturePointStatus.Capturing);
                    cp.setCapturingTeam(team1);
                }
            }
            else if (mod.Equals(cp.getOwner(), team2)) {
                cp.setStatus(CapturePointStatus.Neutralizing);
                cp.setCapturingTeam(team1);
            }
            else {
                cp.setStatus(CapturePointStatus.Capturing);
                cp.setCapturingTeam(team1);
            }
        }
        else if (onpoint[0] < onpoint[1]) {
            if (mod.Equals(cp.getOwner(), team2)) {

                if (cp.getCaptureProgress() == 1) {
                    cp.setStatus(CapturePointStatus.Stable);
                }
                else {
                    cp.setStatus(CapturePointStatus.Capturing);
                    cp.setCapturingTeam(team2);
                }
            }
            else if (mod.Equals(cp.getOwner(), team1)) {
                cp.setStatus(CapturePointStatus.Neutralizing);
                cp.setCapturingTeam(team2);
            }
            else {
                cp.setStatus(CapturePointStatus.Capturing);
                cp.setCapturingTeam(team2);
            }
        }
        else {
            if (onpoint[0] != 0) {
                cp.setStatus(CapturePointStatus.Contested); 
            }
            else {
                if (cp.getCaptureProgress() == 1) {
                    cp.setStatus(CapturePointStatus.Stable);
                }
                else {
                    if (mod.Equals(cp.getOwner(), teamNeutral)) {
                        cp.setStatus(CapturePointStatus.Neutralizing);
                        cp.setCapturingTeam(teamNeutral);
                        console.log("Neutralizing by neutral");
                    }
                    else {
                        cp.setStatus(CapturePointStatus.Capturing);
                    }
                }
                
                
            }
                       
        }

        if (cp.getStatus() != previousCapturePointStatus) {
            cp.statusChanged()
        }
        
        
        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        if (p) {
            p.setCapturePoint(null);
            console.log("Removing flag UI")
            if (p.activeFlagContainerWidget) {
                mod.SetUIWidgetVisible(p.activeFlagContainerWidget, false);    
            }
            
        }
        
        cp.updateUIforPlayersOnPoint();
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
    if (gameStatus == 2) {
        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        if (p) {
            p.isDeployed = false;
        }
    }
    else if (gameStatus == 3) {
        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        if (p) {
            p.isDeployed = false;
            p.addDeath();
        }
           
    }
}

export function OnPlayerEarnedKillAssist(eventPlayer: mod.Player, eventOtherPlayer: mod.Player) {
    if (gameStatus == 3) {
        const p = serverPlayers.get(modlib.getPlayerId(eventPlayer));
        if (p) {
            p.addKillAssist();
            p.addScore(50);
        }
    }
    
}



