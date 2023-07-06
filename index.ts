import { readFileSync } from 'fs';
import Puppeteer from 'puppeteer'
import generate_icalendar from './src/generate_icalendar';
import { red, cyan, green } from 'colors';

console.log(red("Creador de calendarios Javeriana - Achalogy v1.0.0\n\n"));

(async () => {

  console.log(`  ${cyan("Entrando a la web...")}`)
  
  const { username, password } = JSON.parse(readFileSync("./config.json", 'utf-8'));
  const browser = await Puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-gpu'],
    timeout: 0,
    userDataDir: "./session"
  });
  
  const page = await browser.newPage()
  
  await page.goto('https://cs.javeriana.edu.co:8443/psp/CS92PRO/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.CLASS_SEARCH.GBL?')
  
  console.log(`  ${cyan(`Iniciando sesión con ${username}...`)}`)
  try {
    await page.type("#username", username)
    await page.type("#password", password)
    await page.click("#btnlogin")
  } catch { }

  await page.goto("https://cs.javeriana.edu.co:8443/psc/CS92PRO/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.SSR_SSENRL_LIST.GBL?Page=SSR_SSENRL_LIST&Action=A&ACAD_CAREER=PREG&EMPLID=00020516538&ENRL_REQUEST_ID=&INSTITUTION=PUJAV&STRM=2330")

  console.log(`  ${cyan(`Descargando calendario...`)}`)

  const data = await page.evaluate((): any => {
    const tbodys = Array.from(
      document?.querySelectorAll("#ACE_width > tbody > tr:nth-child(10) > td:nth-child(2) > div > table > tbody > tr > td:nth-child(2) > div > table > tbody") ?? []
    )

    if (!tbodys.length) return


    return (tbodys.map((tbody, i) => {

      const clases = Array.from(
        tbody.querySelectorAll("tr:nth-child(3) > td:nth-child(2) > div > table > tbody > tr > td > table > tbody > tr")
      ).slice(1)

      let num_clase = ""
      let section = ""
      let component = ""

      return {
        code: tbody.firstChild?.textContent?.split(" - ")[0],
        name: tbody.firstChild?.textContent?.split(" - ")[1],
        clases: clases.map(c => {
          let _num_clase = c.querySelector("td")?.textContent?.trim()
          let _section = c.querySelector("td:nth-child(2)")?.textContent?.trim()
          let _component = c.querySelector("td:nth-child(3)")?.textContent?.trim()

          const [start_date, end_date] = (c.querySelector("td:nth-child(7)")?.textContent?.trim())?.split(" - ") ?? []

          return {
            num_clase: _num_clase ?? num_clase,
            section: _section ?? section,
            component: _component ?? component,
            date: c.querySelector("td:nth-child(4)")?.textContent?.trim(),
            classroom: c.querySelector("td:nth-child(5)")?.textContent?.trim(),
            teacher: c.querySelector("td:nth-child(6)")?.textContent?.trim(),
            start_date,
            end_date
          }
        })
      }
    }))

  })

  console.log(`  ${cyan(`Convirtiendo a iCalendar...`)}`)
  
  browser.close()
  generate_icalendar(data)

  console.log(`  ${green(`\nTu archivo ha sido guardado como generated.ics`)}`)

})()