// CWA open-data dataset IDs for the short-term township forecast (F-D0047), one per county.
// Source: the third-party table in github.com/rsmallr/ParseCWBOpenData. The ID range matches CWA's own
// product description (F-D0047-001, 003 to 093), but run `npm run probe` once to confirm the mapping
// and the time step of each dataset against your own API key.
export const COUNTY_DATASETS: Record<string, string> = {
  宜蘭縣: 'F-D0047-001',
  桃園市: 'F-D0047-005',
  新竹縣: 'F-D0047-009',
  苗栗縣: 'F-D0047-013',
  彰化縣: 'F-D0047-017',
  南投縣: 'F-D0047-021',
  雲林縣: 'F-D0047-025',
  嘉義縣: 'F-D0047-029',
  屏東縣: 'F-D0047-033',
  臺東縣: 'F-D0047-037',
  花蓮縣: 'F-D0047-041',
  澎湖縣: 'F-D0047-045',
  基隆市: 'F-D0047-049',
  新竹市: 'F-D0047-053',
  嘉義市: 'F-D0047-057',
  臺北市: 'F-D0047-061',
  高雄市: 'F-D0047-065',
  新北市: 'F-D0047-069',
  臺中市: 'F-D0047-073',
  臺南市: 'F-D0047-077',
  連江縣: 'F-D0047-081',
  金門縣: 'F-D0047-085',
}

// The "未來1週" dataset of each county, used for the seven-day suggestion. Same source and same caveat as
// above: the IDs come from a third-party table, so confirm them against your own API key.
export const COUNTY_WEEK_DATASETS: Record<string, string> = {
  宜蘭縣: 'F-D0047-003',
  桃園市: 'F-D0047-007',
  新竹縣: 'F-D0047-011',
  苗栗縣: 'F-D0047-015',
  彰化縣: 'F-D0047-019',
  南投縣: 'F-D0047-023',
  雲林縣: 'F-D0047-027',
  嘉義縣: 'F-D0047-031',
  屏東縣: 'F-D0047-035',
  臺東縣: 'F-D0047-039',
  花蓮縣: 'F-D0047-043',
  澎湖縣: 'F-D0047-047',
  基隆市: 'F-D0047-051',
  新竹市: 'F-D0047-055',
  嘉義市: 'F-D0047-059',
  臺北市: 'F-D0047-063',
  高雄市: 'F-D0047-067',
  新北市: 'F-D0047-071',
  臺中市: 'F-D0047-075',
  臺南市: 'F-D0047-079',
  連江縣: 'F-D0047-083',
  金門縣: 'F-D0047-087',
}

export const DEFAULT_COUNTY = '臺北市'
export const DEFAULT_DISTRICT = '南港區'
