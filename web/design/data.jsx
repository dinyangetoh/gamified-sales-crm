// ─── Shared seed data ───────────────────────────────────────────
// Mirrors the seed in the plan: 8 reps + 1 manager, W21 leader Alice.

const ME = {
  id: 'u-alice',
  name: 'Alice Smith',
  initials: 'AS',
  email: 'alice@demo.com',
  role: 'SALES_REP',
  level: 4, levelLabel: 'Legend',
  totalXP: 820, weekPoints: 340,
  totalPoints: 820,
  currentStreak: 7, longestStreak: 12,
  rank: 1, lastWeekRank: 2,
  pointsGap: 0,
};

const REPS = [
  { id:'u-alice',   name:'Alice Smith',    initials:'AS', email:'alice@demo.com',   weekPoints:340, totalXP:820, level:4, levelLabel:'Legend', currentStreak:7, longestStreak:12, lastWeekRank:2,  badges:4, activity:24, color:'lv-4' },
  { id:'u-diana',   name:'Diana Osei',     initials:'DO', email:'diana@demo.com',   weekPoints:280, totalXP:610, level:3, levelLabel:'Elite',  currentStreak:4, longestStreak:6,  lastWeekRank:3,  badges:3, activity:21, color:'lv-3' },
  { id:'u-bob',     name:'Bob Tanaka',     initials:'BT', email:'bob@demo.com',     weekPoints:240, totalXP:540, level:3, levelLabel:'Elite',  currentStreak:5, longestStreak:9,  lastWeekRank:4,  badges:3, activity:18, color:'lv-3' },
  { id:'u-charlie', name:'Charlie Reyes',  initials:'CR', email:'charlie@demo.com', weekPoints:180, totalXP:310, level:2, levelLabel:'Closer', currentStreak:2, longestStreak:4,  lastWeekRank:6,  badges:1, activity:14, color:'lv-2' },
  { id:'u-evan',    name:'Evan Park',      initials:'EP', email:'evan@demo.com',    weekPoints:160, totalXP:240, level:2, levelLabel:'Closer', currentStreak:3, longestStreak:5,  lastWeekRank:8,  badges:1, activity:12, color:'lv-2' },
  { id:'u-fiona',   name:'Fiona Walsh',    initials:'FW', email:'fiona@demo.com',   weekPoints:140, totalXP:480, level:3, levelLabel:'Elite',  currentStreak:5, longestStreak:8,  lastWeekRank:5,  badges:2, activity:11, color:'lv-3' },
  { id:'u-george',  name:'George Nakamura',initials:'GN', email:'george@demo.com',  weekPoints:100, totalXP:190, level:2, levelLabel:'Closer', currentStreak:1, longestStreak:3,  lastWeekRank:7,  badges:1, activity:22, color:'lv-2' },
  { id:'u-hannah',  name:'Hannah Lee',     initials:'HL', email:'hannah@demo.com',  weekPoints:0,   totalXP:60,  level:1, levelLabel:'Rookie', currentStreak:0, longestStreak:4,  lastWeekRank:9,  badges:0, activity:0,  color:'lv-1' },
];

const RANKED = REPS.map((r, i) => ({
  ...r,
  rank: i + 1,
  pointsGap: i === 0 ? 0 : REPS[i-1].weekPoints - r.weekPoints,
  delta: r.lastWeekRank - (i + 1), // positive = moved up
}));

const BADGE_DEFS = [
  { type:'FIRST_WIN',         name:'First Win',          desc:'Close your first deal.',                       target:1, window:'lifetime', glyph:'I',  tone:'success' },
  { type:'CONSISTENT_CLOSER', name:'Consistent Closer',  desc:'Close 3 deals in a single week.',              target:3, window:'iso_week', glyph:'III',tone:'lv-3' },
  { type:'PIPELINE_BUILDER',  name:'Pipeline Builder',   desc:'Advance 5 deals through stages in a week.',    target:5, window:'iso_week', glyph:'V',  tone:'lv-2' },
  { type:'HOT_STREAK',        name:'Hot Streak',         desc:'Log activity 5 days in a row.',                target:5, window:'lifetime', glyph:'★',  tone:'flame' },
  { type:'TOP_OF_THE_WEEK',   name:'Top of the Week',    desc:'Finish #1 on the leaderboard at end of week.', target:1, window:'iso_week', glyph:'1',  tone:'lv-4' },
  { type:'COMEBACK_KID',      name:'Comeback Kid',       desc:'Bounce back with a better week.',              target:1, window:'iso_week', glyph:'↑',  tone:'lv-2' },
];

// Alice's profile state
const MY_BADGES = {
  earned: [
    { type:'FIRST_WIN',         awardedAt:'2025-05-12' },
    { type:'CONSISTENT_CLOSER', awardedAt:'2025-05-22' },
    { type:'HOT_STREAK',        awardedAt:'2025-05-20' },
    { type:'TOP_OF_THE_WEEK',   awardedAt:'2025-05-18' },
  ],
  inProgress: [
    { type:'PIPELINE_BUILDER', current:3, target:5, weekKey:'2025-W21' },
    { type:'COMEBACK_KID',     current:0, target:1, weekKey:'2025-W21' },
  ],
};

const MY_TIMELINE = [
  { type:'BADGE_EARNED',     badgeType:'CONSISTENT_CLOSER', xp:820, level:4, week:'2025-W21', when:'2h ago',    note:'Earned at Level 4' },
  { type:'LEVEL_UP',         from:3, to:4,                  xp:780, level:4, week:'2025-W21', when:'2h ago',    note:'Closer → Legend' },
  { type:'STREAK_MILESTONE', streak:7,                      xp:640, level:3, week:'2025-W21', when:'yesterday', note:'7-day streak' },
  { type:'BADGE_EARNED',     badgeType:'HOT_STREAK',        xp:580, level:3, week:'2025-W21', when:'May 20',    note:'5 consecutive days' },
  { type:'WEEKLY_TOP_3',     rank:1,                        xp:460, level:3, week:'2025-W20', when:'May 18',    note:'Finished #1 last week' },
  { type:'BADGE_EARNED',     badgeType:'TOP_OF_THE_WEEK',   xp:460, level:3, week:'2025-W20', when:'May 18',    note:'Top of Week 20' },
  { type:'LEVEL_UP',         from:2, to:3,                  xp:280, level:3, week:'2025-W20', when:'May 15',    note:'Closer → Elite' },
  { type:'BADGE_EARNED',     badgeType:'FIRST_WIN',         xp:120, level:1, week:'2025-W20', when:'May 12',    note:'Your first deal' },
];

// Activity feed (events) for the rep's audit log
const MY_EVENTS = [
  { id:'evt-019', type:'DEAL_WON',         entity:'Acme Corp · Enterprise',     pts:100, capped:false, dup:false, when:'2h ago' },
  { id:'evt-018', type:'STAGE_ADVANCED',   entity:'Northwind · Q3 Renewal',     pts:25,  capped:false, dup:false, when:'today 10:14' },
  { id:'evt-017', type:'MEETING_COMPLETED',entity:'Globex · Discovery call',    pts:15,  capped:false, dup:false, when:'today 09:30' },
  { id:'evt-016', type:'LEAD_CONTACTED',   entity:'Initech (lead-882)',         pts:10,  capped:false, dup:false, when:'yesterday' },
  { id:'evt-015', type:'LEAD_CONTACTED',   entity:'Hooli (lead-441)',           pts:10,  capped:false, dup:false, when:'yesterday' },
  { id:'evt-014', type:'LEAD_CONTACTED',   entity:'Soylent (lead-907)',         pts:10,  capped:false, dup:false, when:'yesterday' },
  { id:'evt-013', type:'LEAD_CONTACTED',   entity:'Vandelay (lead-118)',        pts:10,  capped:false, dup:false, when:'yesterday' },
  { id:'evt-012', type:'LEAD_CONTACTED',   entity:'Pied Piper (lead-220)',      pts:10,  capped:false, dup:false, when:'yesterday' },
  { id:'evt-011', type:'LEAD_CONTACTED',   entity:'Pied Piper (lead-220)',      pts:0,   capped:false, dup:true,  when:'yesterday' },
  { id:'evt-010', type:'LEAD_CONTACTED',   entity:'Stark Ind (lead-650)',       pts:0,   capped:true,  dup:false, when:'yesterday' },
];

const LEVEL_CONFIG = [
  { level:1, minXP:0,   label:'Rookie' },
  { level:2, minXP:100, label:'Closer' },
  { level:3, minXP:250, label:'Elite' },
  { level:4, minXP:500, label:'Legend' },
];

const SCORING_RULES = [
  { eventType:'LEAD_CONTACTED',    points:10,  active:true, cap:5  },
  { eventType:'MEETING_COMPLETED', points:15,  active:true, cap:null },
  { eventType:'STAGE_ADVANCED',    points:25,  active:true, cap:null },
  { eventType:'DEAL_WON',          points:100, active:true, cap:null },
  { eventType:'DEAL_LOST',         points:-10, active:true, cap:null },
];

// Notification log (for manager misc tab + rep dashboard)
const NOTIFICATIONS = [
  { id:'n-9', type:'BADGE_UNLOCK',       user:'u-alice', when:'2h ago', sent:true,  payload:{ badge:'CONSISTENT_CLOSER' } },
  { id:'n-8', type:'LEVEL_UP',           user:'u-alice', when:'2h ago', sent:true,  payload:{ from:3, to:4 } },
  { id:'n-7', type:'STREAK_RISK',        user:'u-fiona', when:'18:01',  sent:true,  payload:{ streak:5 } },
  { id:'n-6', type:'STREAK_RISK',        user:'u-hannah',when:'18:01',  sent:true,  payload:{ streak:0 } },
  { id:'n-5', type:'NEAR_BADGE',         user:'u-bob',   when:'May 25', sent:true,  payload:{ badge:'PIPELINE_BUILDER', pct:80 } },
  { id:'n-4', type:'STREAK_BROKEN',      user:'u-george',when:'May 24', sent:true,  payload:{ wasStreak:3 } },
  { id:'n-3', type:'WEEKLY_REP_DIGEST',  user:'u-alice', when:'Mon 08:00', sent:true, payload:{ week:'2025-W21' } },
  { id:'n-2', type:'END_OF_WEEK_PUSH',   user:'u-diana', when:'Fri 16:00', sent:true, payload:{ rank:2, gap:60 } },
  { id:'n-1', type:'TOP_OF_WEEK_AWARD',  user:'u-alice', when:'Sun 23:30', sent:true, payload:{ week:'2025-W20' } },
];

const DLQ_JOBS = [
  { id:'job-3318', queue:'ingestion-queue', error:'Adapter timeout (hubspot.resolveUserId)', attempts:5, failedAt:'14:22' },
  { id:'job-3275', queue:'notification-queue', error:'Resend 429 rate_limit_exceeded', attempts:5, failedAt:'09:48' },
];

// ─── Time-series & chart data ───────────────────────────────────

// Alice's points per day this week (Mon-Sun, today=Mon of W21)
const MY_WEEK_PTS  = [0, 65, 40, 85, 25, 100, 25];     // current week
const MY_PREV_WEEK = [10, 30, 50, 40, 60, 60, 30];     // last week
const MY_LAST_30   = [10,0,40,30,60,20,80, 0,40,30,50,70,20,100, 10,30,50,40,60,60,30, 0,65,40,85,25,100,25, 0,15];

// Alice's streak weekday strip — last 14 days (true = active)
const MY_STREAK_DAYS = [
  // 2 weeks ago through today
  {d:'M', active:true}, {d:'T', active:true}, {d:'W', active:false},{d:'T', active:true},
  {d:'F', active:true}, {d:'S', active:false},{d:'S', active:false},
  {d:'M', active:true}, {d:'T', active:true}, {d:'W', active:true}, {d:'T', active:true},
  {d:'F', active:true}, {d:'S', active:true}, {d:'S', active:true, today:true},
];

// Team-wide event mix (Week 21)
const TEAM_EVENT_MIX = [
  { label:'LEAD_CONTACTED',    value:54, color:'#6c7280' },
  { label:'MEETING_COMPLETED', value:28, color:'#4a63b8' },
  { label:'STAGE_ADVANCED',    value:24, color:'#7a4fbe' },
  { label:'DEAL_WON',          value:12, color:'#3a8f63' },
  { label:'DEAL_LOST',         value:4,  color:'#b94a3b' },
];

// Level distribution
const LEVEL_DIST = [
  { label:'Legend (L4)', value:1, color:'#b88420' },
  { label:'Elite (L3)',  value:3, color:'#7a4fbe' },
  { label:'Closer (L2)', value:3, color:'#4a63b8' },
  { label:'Rookie (L1)', value:1, color:'#6c7280' },
];

// Team points over last 8 weeks
const TEAM_WEEKS = ['W14','W15','W16','W17','W18','W19','W20','W21'];
const TEAM_POINTS_TS = [820, 940, 1080, 1020, 1180, 1220, 1280, 1440];
const TEAM_EVENTS_TS = [82, 95, 110, 102, 118, 120, 122, 122];

// Day-of-week activity pattern (Mon-Sun for current week)
const DOW_ACTIVITY = [28, 24, 26, 22, 18, 3, 1];

// Heatmap: day-of-week x time-of-day buckets (5 buckets: 8a-10a, 10a-12p, 12-2p, 2-4p, 4-6p)
const ACTIVITY_HEATMAP = [
  [6, 8, 4, 5, 3], // Mon
  [4, 7, 3, 5, 4], // Tue
  [5, 6, 5, 6, 3], // Wed
  [3, 6, 2, 7, 3], // Thu
  [2, 4, 3, 5, 3], // Fri
  [0, 1, 0, 1, 1], // Sat
  [0, 0, 1, 0, 0], // Sun
];

// Top performers per category
const TOP_BY = {
  calls:    [{ id:'u-george',  v:18 }, { id:'u-alice', v:14 }, { id:'u-diana', v:12 }],
  meetings: [{ id:'u-diana',   v:9  }, { id:'u-alice', v:8  }, { id:'u-bob',   v:6  }],
  pipeline: [{ id:'u-bob',     v:7  }, { id:'u-alice', v:5  }, { id:'u-fiona', v:4  }],
  wins:     [{ id:'u-alice',   v:3  }, { id:'u-diana', v:2  }, { id:'u-charlie', v:1 }],
};

// Activities page — fuller event log (W21 across all of Alice's days)
const MY_ACTIVITY_FULL = [
  { id:'evt-019', type:'DEAL_WON',          entity:'Acme Corp · Enterprise',   pts:100, capped:false, dup:false, date:'2025-05-26', when:'14:02' },
  { id:'evt-018', type:'STAGE_ADVANCED',    entity:'Northwind · Q3 Renewal',   pts:25,  capped:false, dup:false, date:'2025-05-26', when:'10:14' },
  { id:'evt-017', type:'MEETING_COMPLETED', entity:'Globex · Discovery call',  pts:15,  capped:false, dup:false, date:'2025-05-26', when:'09:30' },
  { id:'evt-016', type:'LEAD_CONTACTED',    entity:'Initech (lead-882)',       pts:10,  capped:false, dup:false, date:'2025-05-25', when:'17:48' },
  { id:'evt-015', type:'LEAD_CONTACTED',    entity:'Hooli (lead-441)',         pts:10,  capped:false, dup:false, date:'2025-05-25', when:'15:22' },
  { id:'evt-014', type:'LEAD_CONTACTED',    entity:'Soylent (lead-907)',       pts:10,  capped:false, dup:false, date:'2025-05-25', when:'13:10' },
  { id:'evt-013', type:'LEAD_CONTACTED',    entity:'Vandelay (lead-118)',      pts:10,  capped:false, dup:false, date:'2025-05-25', when:'11:48' },
  { id:'evt-012', type:'LEAD_CONTACTED',    entity:'Pied Piper (lead-220)',    pts:10,  capped:false, dup:false, date:'2025-05-25', when:'10:02' },
  { id:'evt-011', type:'LEAD_CONTACTED',    entity:'Pied Piper (lead-220)',    pts:0,   capped:false, dup:true,  date:'2025-05-25', when:'10:03' },
  { id:'evt-010', type:'LEAD_CONTACTED',    entity:'Stark Ind (lead-650)',     pts:0,   capped:true,  dup:false, date:'2025-05-25', when:'09:51' },
  { id:'evt-009', type:'STAGE_ADVANCED',    entity:'Cyberdyne · Pilot',        pts:25,  capped:false, dup:false, date:'2025-05-24', when:'16:32' },
  { id:'evt-008', type:'DEAL_WON',          entity:'Wonka Industries',         pts:100, capped:false, dup:false, date:'2025-05-23', when:'15:08' },
  { id:'evt-007', type:'MEETING_COMPLETED', entity:'Tyrell · Negotiation',     pts:15,  capped:false, dup:false, date:'2025-05-23', when:'11:30' },
  { id:'evt-006', type:'DEAL_LOST',         entity:'Aperture · Lab Renewal',   pts:-10, capped:false, dup:false, date:'2025-05-22', when:'17:00' },
  { id:'evt-005', type:'STAGE_ADVANCED',    entity:'Massive Dynamic',          pts:25,  capped:false, dup:false, date:'2025-05-22', when:'10:20' },
  { id:'evt-004', type:'DEAL_WON',          entity:'Oscorp · Year 2',          pts:100, capped:false, dup:false, date:'2025-05-21', when:'14:55' },
  { id:'evt-003', type:'MEETING_COMPLETED', entity:'Umbrella · Demo',          pts:15,  capped:false, dup:false, date:'2025-05-21', when:'09:00' },
  { id:'evt-002', type:'LEAD_CONTACTED',    entity:'Wayne Enterprises',        pts:10,  capped:false, dup:false, date:'2025-05-20', when:'13:42' },
  { id:'evt-001', type:'STAGE_ADVANCED',    entity:'Black Mesa · Phase 2',     pts:25,  capped:false, dup:false, date:'2025-05-20', when:'10:05' },
];

// Activity mix for the rep
const MY_EVENT_MIX = [
  { label:'LEAD_CONTACTED',    value:7, color:'#6c7280' },
  { label:'MEETING_COMPLETED', value:3, color:'#4a63b8' },
  { label:'STAGE_ADVANCED',    value:4, color:'#7a4fbe' },
  { label:'DEAL_WON',          value:3, color:'#3a8f63' },
  { label:'DEAL_LOST',         value:1, color:'#b94a3b' },
];

// Personal records / all time stats for rep
const MY_RECORDS = {
  bestWeek:     { value:340, when:'W21 · this week' },
  bestDay:      { value:140, when:'May 23' },
  longestStreak:{ value:12,  when:'Apr 28 – May 9' },
  totalDeals:   { value:14, when:'all time' },
  totalEvents:  { value:142, when:'all time' },
  winRate:      { value:68, when:'last 30 days' },
};

Object.assign(window, {
  ME, REPS, RANKED, BADGE_DEFS, MY_BADGES, MY_TIMELINE, MY_EVENTS,
  LEVEL_CONFIG, SCORING_RULES, NOTIFICATIONS, DLQ_JOBS,
  MY_WEEK_PTS, MY_PREV_WEEK, MY_LAST_30, MY_STREAK_DAYS,
  TEAM_EVENT_MIX, LEVEL_DIST, TEAM_WEEKS, TEAM_POINTS_TS, TEAM_EVENTS_TS,
  DOW_ACTIVITY, ACTIVITY_HEATMAP, TOP_BY, MY_ACTIVITY_FULL, MY_EVENT_MIX, MY_RECORDS,
});
