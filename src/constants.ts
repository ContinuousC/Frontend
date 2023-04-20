/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { VictoryThemeDefinition } from "victory";
import { Status, Severity } from "@continuousc/relation-graph";

import {
  RelativeDateTime,
  DateTimeInterval,
  DateTimeUnit,
  ChangeEventSource,
} from "./types/frontend";
import {
  NewAlertRuleFormInternal,
  AlertRuleConfigInternal,
  AlertRuleTemplateInternal,
} from "./types/form";

export const DEFAULT_BIN_INFO = {
  configuration: [],
  status: [],
  isLoading: false,
  elementIds: { nodes: [], edges: [] },
};
export const TOPOLOGY_FILTER_PREFIX = "topologyFilter_";

export const SEVERITIES: Severity[] = ["minor", "warning", "major", "critical"];
export const STATUSES: Status[] = ["ok", ...SEVERITIES] as const;
export const REV_SEVERITIES = [...SEVERITIES].reverse();
export const REV_STATUSES = [...STATUSES].reverse();
export const CHANGE_EVENT_SOURCES: ChangeEventSource[] = [
  "status",
  "configuration",
] as const;

export const STATUS_TO_TAILWIND_COLOR: {
  [key in Status]: {
    text: string;
    background: string;
    border: string;
  };
} = {
  major: {
    text: "text-major",
    background: "bg-major",
    border: "border-major",
  },
  critical: {
    text: "text-critical",
    background: "bg-critical",
    border: "border-critical",
  },
  warning: {
    text: "text-warning",
    background: "bg-warning",
    border: "border-warning",
  },
  minor: {
    text: "text-minor",
    background: "bg-minor",
    border: "border-minor",
  },
  ok: {
    text: "text-ok",
    background: "bg-ok",
    border: "border-ok",
  },
};

export const RANDOM_SPLITTER = "SPLITTER";
export const PRIMARY_COLOR = "#006eff";
export const SECONDARY_COLOR = "#736635";
export const CRITICAL_COLOR = "#ff0000";
export const MAJOR_COLOR = "#ffaa00";
export const WARNING_COLOR = "#eeee00";
export const MINOR_COLOR = "#eeaa88";
export const OK_COLOR = "#00aa00";
export const VIEW_CONTEXT = ["topology", "itemType", "openAlerts"] as const;
export const VIEW_ITEM_TYPE_CONTEXT = ["grid", "table", "metrics"] as const;
export const ITEM_OVERVIEW_CONTEXT = [
  "topology",
  "metrics",
  "openAlerts",
] as const;
export const DATE_TIME_INTERVALS: DateTimeInterval[] = [
  "auto",
  "day",
  "hour",
  "minute",
  "month",
  "quarter",
  "second",
  "week",
  "year",
];
export const TOPOLOGY_LIMIT = 1000;
export const NOW_DATE_RELATIVE_TIME: RelativeDateTime = {
  value: 0,
  unit: "now",
};
export const SHORT_CUT_ITEMS: RelativeDateTime[] = [
  NOW_DATE_RELATIVE_TIME,
  {
    value: 5,
    unit: "minute",
  },
  {
    value: 15,
    unit: "minute",
  },
  {
    value: 30,
    unit: "minute",
  },
  {
    value: 1,
    unit: "hour",
  },
  {
    value: 1,
    unit: "day",
  },
  {
    value: 1,
    unit: "week",
  },
  {
    value: "startOf",
    unit: "day",
  },
  {
    value: "startOf",
    unit: "week",
  },
  {
    value: "startOf",
    unit: "month",
  },
];

export const RELATIVE_OPTIONS: DateTimeUnit[] = [
  "second",
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "year",
];

export const RELATIVE_OPTIONS_REVERSE: DateTimeUnit[] =
  RELATIVE_OPTIONS.reverse();

export const TIME_AXIS_FORMAT_MINOR: {
  [key in DateTimeUnit]: string;
} = {
  millisecond: 'S""',
  second: 's"',
  minute: "m’",
  hour: "t",
  day: "d",
  week: "d",
  month: "MMM",
  quarter: "q",
  year: "yyyy",
};

export const TIME_AXIS_FORMAT_MAJOR: {
  [key in DateTimeUnit]: string;
} = {
  millisecond: "S",
  second: "FF",
  minute: "ff",
  hour: "DD, H'h'",
  day: "DD",
  week: "W",
  month: "MMM, yyyy",
  quarter: "q",
  year: "yyyy",
};

export const MINOR_TO_MAJOR: {
  [key in DateTimeUnit]: DateTimeUnit;
} = {
  millisecond: "second",
  second: "minute",
  minute: "hour",
  hour: "day",
  day: "month",
  week: "month",
  month: "year",
  quarter: "year",
  year: "year",
};

export const BINS_TO_MINOR: {
  [key in DateTimeUnit]: DateTimeUnit[];
} = {
  millisecond: ["millisecond", "second"],
  second: ["second", "minute"],
  minute: ["minute", "hour"],
  hour: ["hour", "day", "week"],
  day: ["day", "week", "month"],
  week: ["week", "month", "quarter"],
  month: ["month", "quarter", "year"],
  quarter: ["quarter", "year"],
  year: ["year"],
};

export const TIME_LINE_INTERVALS: { [key in DateTimeUnit]: number[] } = {
  millisecond: [],
  second: [1, 2, 5, 10, 15, 20, 30],
  minute: [1, 2, 5, 10, 15, 20, 30],
  hour: [1, 2, 3, 4, 6, 8, 12],
  day: [1, 2],
  week: [1, 2],
  month: [1, 2],
  quarter: [1, 2],
  year: [1, 2, 5, 10],
};

export type TimeZone = (typeof TIME_ZONES)[number];

export const TIME_ZONES = [
  "Africa/Abidjan",
  "Africa/Accra",
  "Africa/Addis_Ababa",
  "Africa/Algiers",
  "Africa/Asmera",
  "Africa/Bamako",
  "Africa/Bangui",
  "Africa/Banjul",
  "Africa/Bissau",
  "Africa/Blantyre",
  "Africa/Brazzaville",
  "Africa/Bujumbura",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Ceuta",
  "Africa/Conakry",
  "Africa/Dakar",
  "Africa/Dar_es_Salaam",
  "Africa/Djibouti",
  "Africa/Douala",
  "Africa/El_Aaiun",
  "Africa/Freetown",
  "Africa/Gaborone",
  "Africa/Harare",
  "Africa/Johannesburg",
  "Africa/Juba",
  "Africa/Kampala",
  "Africa/Khartoum",
  "Africa/Kigali",
  "Africa/Kinshasa",
  "Africa/Lagos",
  "Africa/Libreville",
  "Africa/Lome",
  "Africa/Luanda",
  "Africa/Lubumbashi",
  "Africa/Lusaka",
  "Africa/Malabo",
  "Africa/Maputo",
  "Africa/Maseru",
  "Africa/Mbabane",
  "Africa/Mogadishu",
  "Africa/Monrovia",
  "Africa/Nairobi",
  "Africa/Ndjamena",
  "Africa/Niamey",
  "Africa/Nouakchott",
  "Africa/Ouagadougou",
  "Africa/Porto-Novo",
  "Africa/Sao_Tome",
  "Africa/Tripoli",
  "Africa/Tunis",
  "Africa/Windhoek",
  "America/Adak",
  "America/Anchorage",
  "America/Anguilla",
  "America/Antigua",
  "America/Araguaina",
  "America/Argentina/La_Rioja",
  "America/Argentina/Rio_Gallegos",
  "America/Argentina/Salta",
  "America/Argentina/San_Juan",
  "America/Argentina/San_Luis",
  "America/Argentina/Tucuman",
  "America/Argentina/Ushuaia",
  "America/Aruba",
  "America/Asuncion",
  "America/Bahia",
  "America/Bahia_Banderas",
  "America/Barbados",
  "America/Belem",
  "America/Belize",
  "America/Blanc-Sablon",
  "America/Boa_Vista",
  "America/Bogota",
  "America/Boise",
  "America/Buenos_Aires",
  "America/Cambridge_Bay",
  "America/Campo_Grande",
  "America/Cancun",
  "America/Caracas",
  "America/Catamarca",
  "America/Cayenne",
  "America/Cayman",
  "America/Chicago",
  "America/Chihuahua",
  "America/Ciudad_Juarez",
  "America/Coral_Harbour",
  "America/Cordoba",
  "America/Costa_Rica",
  "America/Creston",
  "America/Cuiaba",
  "America/Curacao",
  "America/Danmarkshavn",
  "America/Dawson",
  "America/Dawson_Creek",
  "America/Denver",
  "America/Detroit",
  "America/Dominica",
  "America/Edmonton",
  "America/Eirunepe",
  "America/El_Salvador",
  "America/Fort_Nelson",
  "America/Fortaleza",
  "America/Glace_Bay",
  "America/Godthab",
  "America/Goose_Bay",
  "America/Grand_Turk",
  "America/Grenada",
  "America/Guadeloupe",
  "America/Guatemala",
  "America/Guayaquil",
  "America/Guyana",
  "America/Halifax",
  "America/Havana",
  "America/Hermosillo",
  "America/Indiana/Knox",
  "America/Indiana/Marengo",
  "America/Indiana/Petersburg",
  "America/Indiana/Tell_City",
  "America/Indiana/Vevay",
  "America/Indiana/Vincennes",
  "America/Indiana/Winamac",
  "America/Indianapolis",
  "America/Inuvik",
  "America/Iqaluit",
  "America/Jamaica",
  "America/Jujuy",
  "America/Juneau",
  "America/Kentucky/Monticello",
  "America/Kralendijk",
  "America/La_Paz",
  "America/Lima",
  "America/Los_Angeles",
  "America/Louisville",
  "America/Lower_Princes",
  "America/Maceio",
  "America/Managua",
  "America/Manaus",
  "America/Marigot",
  "America/Martinique",
  "America/Matamoros",
  "America/Mazatlan",
  "America/Mendoza",
  "America/Menominee",
  "America/Merida",
  "America/Metlakatla",
  "America/Mexico_City",
  "America/Miquelon",
  "America/Moncton",
  "America/Monterrey",
  "America/Montevideo",
  "America/Montserrat",
  "America/Nassau",
  "America/New_York",
  "America/Nipigon",
  "America/Nome",
  "America/Noronha",
  "America/North_Dakota/Beulah",
  "America/North_Dakota/Center",
  "America/North_Dakota/New_Salem",
  "America/Ojinaga",
  "America/Panama",
  "America/Pangnirtung",
  "America/Paramaribo",
  "America/Phoenix",
  "America/Port-au-Prince",
  "America/Port_of_Spain",
  "America/Porto_Velho",
  "America/Puerto_Rico",
  "America/Punta_Arenas",
  "America/Rainy_River",
  "America/Rankin_Inlet",
  "America/Recife",
  "America/Regina",
  "America/Resolute",
  "America/Rio_Branco",
  "America/Santa_Isabel",
  "America/Santarem",
  "America/Santiago",
  "America/Santo_Domingo",
  "America/Sao_Paulo",
  "America/Scoresbysund",
  "America/Sitka",
  "America/St_Barthelemy",
  "America/St_Johns",
  "America/St_Kitts",
  "America/St_Lucia",
  "America/St_Thomas",
  "America/St_Vincent",
  "America/Swift_Current",
  "America/Tegucigalpa",
  "America/Thule",
  "America/Thunder_Bay",
  "America/Tijuana",
  "America/Toronto",
  "America/Tortola",
  "America/Vancouver",
  "America/Whitehorse",
  "America/Winnipeg",
  "America/Yakutat",
  "America/Yellowknife",
  "Antarctica/Casey",
  "Antarctica/Davis",
  "Antarctica/DumontDUrville",
  "Antarctica/Macquarie",
  "Antarctica/Mawson",
  "Antarctica/McMurdo",
  "Antarctica/Palmer",
  "Antarctica/Rothera",
  "Antarctica/Syowa",
  "Antarctica/Troll",
  "Antarctica/Vostok",
  "Arctic/Longyearbyen",
  "Asia/Aden",
  "Asia/Almaty",
  "Asia/Amman",
  "Asia/Anadyr",
  "Asia/Aqtau",
  "Asia/Aqtobe",
  "Asia/Ashgabat",
  "Asia/Atyrau",
  "Asia/Baghdad",
  "Asia/Bahrain",
  "Asia/Baku",
  "Asia/Bangkok",
  "Asia/Barnaul",
  "Asia/Beirut",
  "Asia/Bishkek",
  "Asia/Brunei",
  "Asia/Calcutta",
  "Asia/Chita",
  "Asia/Choibalsan",
  "Asia/Colombo",
  "Asia/Damascus",
  "Asia/Dhaka",
  "Asia/Dili",
  "Asia/Dubai",
  "Asia/Dushanbe",
  "Asia/Famagusta",
  "Asia/Gaza",
  "Asia/Hebron",
  "Asia/Hong_Kong",
  "Asia/Hovd",
  "Asia/Irkutsk",
  "Asia/Jakarta",
  "Asia/Jayapura",
  "Asia/Jerusalem",
  "Asia/Kabul",
  "Asia/Kamchatka",
  "Asia/Karachi",
  "Asia/Katmandu",
  "Asia/Khandyga",
  "Asia/Krasnoyarsk",
  "Asia/Kuala_Lumpur",
  "Asia/Kuching",
  "Asia/Kuwait",
  "Asia/Macau",
  "Asia/Magadan",
  "Asia/Makassar",
  "Asia/Manila",
  "Asia/Muscat",
  "Asia/Nicosia",
  "Asia/Novokuznetsk",
  "Asia/Novosibirsk",
  "Asia/Omsk",
  "Asia/Oral",
  "Asia/Phnom_Penh",
  "Asia/Pontianak",
  "Asia/Pyongyang",
  "Asia/Qatar",
  "Asia/Qostanay",
  "Asia/Qyzylorda",
  "Asia/Rangoon",
  "Asia/Riyadh",
  "Asia/Saigon",
  "Asia/Sakhalin",
  "Asia/Samarkand",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Srednekolymsk",
  "Asia/Taipei",
  "Asia/Tashkent",
  "Asia/Tbilisi",
  "Asia/Tehran",
  "Asia/Thimphu",
  "Asia/Tokyo",
  "Asia/Tomsk",
  "Asia/Ulaanbaatar",
  "Asia/Urumqi",
  "Asia/Ust-Nera",
  "Asia/Vientiane",
  "Asia/Vladivostok",
  "Asia/Yakutsk",
  "Asia/Yekaterinburg",
  "Asia/Yerevan",
  "Atlantic/Azores",
  "Atlantic/Bermuda",
  "Atlantic/Canary",
  "Atlantic/Cape_Verde",
  "Atlantic/Faeroe",
  "Atlantic/Madeira",
  "Atlantic/Reykjavik",
  "Atlantic/South_Georgia",
  "Atlantic/St_Helena",
  "Atlantic/Stanley",
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Broken_Hill",
  "Australia/Currie",
  "Australia/Darwin",
  "Australia/Eucla",
  "Australia/Hobart",
  "Australia/Lindeman",
  "Australia/Lord_Howe",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Andorra",
  "Europe/Astrakhan",
  "Europe/Athens",
  "Europe/Belgrade",
  "Europe/Berlin",
  "Europe/Bratislava",
  "Europe/Brussels",
  "Europe/Bucharest",
  "Europe/Budapest",
  "Europe/Busingen",
  "Europe/Chisinau",
  "Europe/Copenhagen",
  "Europe/Dublin",
  "Europe/Gibraltar",
  "Europe/Guernsey",
  "Europe/Helsinki",
  "Europe/Isle_of_Man",
  "Europe/Istanbul",
  "Europe/Jersey",
  "Europe/Kaliningrad",
  "Europe/Kiev",
  "Europe/Kirov",
  "Europe/Lisbon",
  "Europe/Ljubljana",
  "Europe/London",
  "Europe/Luxembourg",
  "Europe/Madrid",
  "Europe/Malta",
  "Europe/Mariehamn",
  "Europe/Minsk",
  "Europe/Monaco",
  "Europe/Moscow",
  "Europe/Oslo",
  "Europe/Paris",
  "Europe/Podgorica",
  "Europe/Prague",
  "Europe/Riga",
  "Europe/Rome",
  "Europe/Samara",
  "Europe/San_Marino",
  "Europe/Sarajevo",
  "Europe/Saratov",
  "Europe/Simferopol",
  "Europe/Skopje",
  "Europe/Sofia",
  "Europe/Stockholm",
  "Europe/Tallinn",
  "Europe/Tirane",
  "Europe/Ulyanovsk",
  "Europe/Uzhgorod",
  "Europe/Vaduz",
  "Europe/Vatican",
  "Europe/Vienna",
  "Europe/Vilnius",
  "Europe/Volgograd",
  "Europe/Warsaw",
  "Europe/Zagreb",
  "Europe/Zaporozhye",
  "Europe/Zurich",
  "Indian/Antananarivo",
  "Indian/Chagos",
  "Indian/Christmas",
  "Indian/Cocos",
  "Indian/Comoro",
  "Indian/Kerguelen",
  "Indian/Mahe",
  "Indian/Maldives",
  "Indian/Mauritius",
  "Indian/Mayotte",
  "Indian/Reunion",
  "Pacific/Apia",
  "Pacific/Auckland",
  "Pacific/Bougainville",
  "Pacific/Chatham",
  "Pacific/Easter",
  "Pacific/Efate",
  "Pacific/Enderbury",
  "Pacific/Fakaofo",
  "Pacific/Fiji",
  "Pacific/Funafuti",
  "Pacific/Galapagos",
  "Pacific/Gambier",
  "Pacific/Guadalcanal",
  "Pacific/Guam",
  "Pacific/Honolulu",
  "Pacific/Johnston",
  "Pacific/Kiritimati",
  "Pacific/Kosrae",
  "Pacific/Kwajalein",
  "Pacific/Majuro",
  "Pacific/Marquesas",
  "Pacific/Midway",
  "Pacific/Nauru",
  "Pacific/Niue",
  "Pacific/Norfolk",
  "Pacific/Noumea",
  "Pacific/Pago_Pago",
  "Pacific/Palau",
  "Pacific/Pitcairn",
  "Pacific/Ponape",
  "Pacific/Port_Moresby",
  "Pacific/Rarotonga",
  "Pacific/Saipan",
  "Pacific/Tahiti",
  "Pacific/Tarawa",
  "Pacific/Tongatapu",
  "Pacific/Truk",
  "Pacific/Wake",
  "Pacific/Wallis",
] as const;

// Colors
const yellow200 = "#FFF59D";
const deepOrange600 = "#F4511E";
const lime300 = "#DCE775";
const lightGreen500 = "#8BC34A";
const teal700 = "#00796B";
const cyan900 = "#006064";
const colors = [
  deepOrange600,
  yellow200,
  lime300,
  lightGreen500,
  teal700,
  cyan900,
];
const blueGrey50 = "#ECEFF1";
//const blueGrey300 = "#90A4AE";
const blueGrey700 = "#455A64";
const grey900 = "grey";

// Typography
const sansSerif = "'Helvetica', 'Arial', sans-serif";
const letterSpacing = "normal";
const fontSize = 18;

// Layout
const padding = 8;
const baseProps = {
  width: 350,
  height: 350,
  padding: 50,
};

// * Labels
const baseLabelStyles = {
  fontFamily: sansSerif,
  fontSize,
  letterSpacing,
  padding,
  fill: blueGrey700,
  stroke: "transparent",
  strokeWidth: 0,
  fontWeight: "bold",
};

const centeredLabelStyles = Object.assign(
  { textAnchor: "middle" },
  baseLabelStyles
);

// Strokes
const strokeDasharray = "10, 5";
const strokeLinecap = "round";
const strokeLinejoin = "round";

export const VICTORY_THEME: VictoryThemeDefinition = {
  area: Object.assign(
    {
      style: {
        data: {
          fill: grey900,
        },
        labels: baseLabelStyles,
      },
    },
    baseProps
  ),
  axis: {
    style: {
      axis: {
        fill: "transparent",
        //stroke: blueGrey300,
        stroke: ({ tick, ticks }) =>
          tick === ticks[0] ? grey900 : blueGrey700,
        strokeWidth: 1,
        strokeLinecap,
        strokeLinejoin,
      },
      axisLabel: {
        ...centeredLabelStyles,
        padding,
        stroke: "transparent",
      },
      grid: {
        fill: "none",
        stroke: ({ tick, ticks }) => (tick === ticks[0] ? "" : blueGrey50),
        strokeDasharray: ({ tick, ticks }) =>
          tick === ticks[0] ? 0 : strokeDasharray,
        strokeLinecap,
        strokeLinejoin,
        pointerEvents: "painted",
      },
      ticks: {
        fill: "transparent",
        size: 7,
        stroke: grey900,
        strokeWidth: 1.5,
        strokeLinecap,
        strokeLinejoin,
      },
      tickLabels: {
        ...baseLabelStyles,
        fill: "black",
      },
    },
    ...baseProps,
  },
  polarDependentAxis: Object.assign({
    style: {
      ticks: {
        fill: "transparent",
        size: 1,
        stroke: "transparent",
      },
    },
  }),
  bar: Object.assign(
    {
      style: {
        data: {
          fill: blueGrey700,
          padding,
          strokeWidth: 0,
        },
        labels: baseLabelStyles,
      },
    },
    baseProps
  ),
  boxplot: Object.assign(
    {
      style: {
        max: { padding, stroke: blueGrey700, strokeWidth: 1 },
        maxLabels: Object.assign({}, baseLabelStyles, { padding: 3 }),
        median: { padding, stroke: blueGrey700, strokeWidth: 1 },
        medianLabels: Object.assign({}, baseLabelStyles, { padding: 3 }),
        min: { padding, stroke: blueGrey700, strokeWidth: 1 },
        minLabels: Object.assign({}, baseLabelStyles, { padding: 3 }),
        q1: { padding, fill: blueGrey700 },
        q1Labels: Object.assign({}, baseLabelStyles, { padding: 3 }),
        q3: { padding, fill: blueGrey700 },
        q3Labels: Object.assign({}, baseLabelStyles, { padding: 3 }),
      },
      boxWidth: 20,
    },
    baseProps
  ),
  candlestick: Object.assign(
    {
      style: {
        data: {
          stroke: blueGrey700,
        },
        labels: Object.assign({}, baseLabelStyles, { padding: 5 }),
      },
      candleColors: {
        positive: "#ffffff",
        negative: blueGrey700,
      },
    },
    baseProps
  ),
  chart: baseProps,
  errorbar: Object.assign(
    {
      borderWidth: 8,
      style: {
        data: {
          fill: "transparent",
          opacity: 1,
          stroke: blueGrey700,
          strokeWidth: 2,
        },
        labels: baseLabelStyles,
      },
    },
    baseProps
  ),
  group: Object.assign(
    {
      colorScale: colors,
    },
    baseProps
  ),
  histogram: {
    style: {
      data: {
        stroke: grey900,
        //strokeWidth: 2,
        strokeWidth: 1,
        //fill: blueGrey700,
        fill: PRIMARY_COLOR,
        fillOpacity: ({ active }) => (active ? 0.5 : 1),
      },
      labels: baseLabelStyles,
    },
    ...baseProps,
  },
  legend: {
    colorScale: colors,
    gutter: 10,
    orientation: "vertical",
    titleOrientation: "top",
    style: {
      data: {
        type: "circle",
      },
      labels: baseLabelStyles,
      title: Object.assign({}, baseLabelStyles, { padding: 5 }),
    },
  },
  line: {
    style: {
      data: {
        fill: "transparent",
        opacity: 1,
        stroke: blueGrey700,
        strokeWidth: 2,
      },
      labels: baseLabelStyles,
    },
    ...baseProps,
  },
  pie: Object.assign(
    {
      colorScale: colors,
      style: {
        data: {
          padding,
          stroke: blueGrey50,
          strokeWidth: 1,
        },
        labels: Object.assign({}, baseLabelStyles, { padding: 20 }),
      },
    },
    baseProps
  ),
  scatter: Object.assign(
    {
      style: {
        data: {
          fill: blueGrey700,
          opacity: 1,
          stroke: "transparent",
          strokeWidth: 0,
        },
        labels: baseLabelStyles,
      },
    },
    baseProps
  ),
  stack: Object.assign(
    {
      colorScale: colors,
    },
    baseProps
  ),
  tooltip: {
    style: Object.assign({}, baseLabelStyles, {
      padding: 0,
      pointerEvents: "none",
    }),
    flyoutStyle: {
      stroke: grey900,
      strokeWidth: 1,
      fill: "#f0f0f0",
      pointerEvents: "none",
    },
    flyoutPadding: 5,
    cornerRadius: 5,
    pointerLength: 10,
  },
  voronoi: Object.assign(
    {
      style: {
        data: {
          fill: "transparent",
          stroke: "transparent",
          strokeWidth: 0,
        },
        labels: Object.assign({}, baseLabelStyles, {
          padding: 5,
          pointerEvents: "none",
        }),
        flyout: {
          stroke: grey900,
          strokeWidth: 1,
          fill: "#f0f0f0",
          pointerEvents: "none",
        },
      },
    },
    baseProps
  ),
};

export const VICTORY_THEME_DARK: VictoryThemeDefinition = {
  ...VICTORY_THEME,
};

export const VICTORY_BASE_STANDALONE_AXIS = {
  tickLabels: { fill: "none" },
  axis: { stroke: grey900, fill: grey900 },
  grid: {
    fill: "none",
    stroke: "none",
    pointerEvents: "painted",
  },
  ticks: {
    fill: "transparent",
    stroke: "transparent",
  },
};

export const ALERT_TEMPLATE_FORM_DEFAULT: AlertRuleTemplateInternal = {
  common: {
    alert: "",
    annotations: {
      summary: null,
      description: null,
      runbook_url: null,
    },
  },
  specific: {
    type: "custom",
    custom: {
      item: "",
      expr: "",
      valueUnit: {
        dimension: "dimensionless",
        unit: "",
      },
      params: [],
    },
  },
};

export const ALERT_CONFIG_FORM_DEFAULT: AlertRuleConfigInternal = {
  type: "custom",
  custom: [],
};

export const ALERT_ADD_FORM_DEFAULT: NewAlertRuleFormInternal = {
  name: "",
  type: "custom",
};

export const WIDGET_DIMENSIONS = {
  1: {
    widthTailwind: "w-[400px]",
    width: 400,
    height: 400,
    heightTailwind: "h-[400px]",
  },
  2: {
    widthTailwind: "w-[800px]",
    width: 800,
    height: 400,
    heightTailwind: "h-[400px]",
  },
};
