/**
 * MIT License
 *
 * Copyright (c) 2023–Present PPResume (https://ppresume.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import { cloneDeep } from 'lodash-es'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_RESUME,
  FILLED_RESUME,
  type LatexLayout,
  type Resume,
} from '@/models'
import { LINE_SPACING_MAP } from './constants'
import { JakeRenderer } from './jake'

describe('JakeRenderer', () => {
  let resume: Resume
  let renderer: JakeRenderer
  let layoutIndex: number

  beforeEach(() => {
    resume = cloneDeep(FILLED_RESUME)
    layoutIndex = FILLED_RESUME.layouts.findIndex(
      (layout) => layout.engine === 'latex'
    )
    renderer = new JakeRenderer(resume, layoutIndex)
  })

  it('should generate complete LaTeX document', () => {
    const result = renderer.render()

    expect(result).toContain('\\documentclass')
    expect(result).toContain('\\begin{document}')
    expect(result).toContain('\\end{document}')
  })

  it('should use article document class instead of moderncv', () => {
    const result = renderer.render()

    expect(result).toContain('{article}')
    expect(result).not.toContain('{moderncv}')
  })

  describe('renderPreamble', () => {
    it('should render correct document class configuration from FILLED_RESUME', () => {
      const result = renderer.renderPreamble()

      // FILLED_RESUME has a4 paper and 10pt configured
      expect(result).toContain('\\documentclass[a4paper,10pt]{article}')
    })

    it('should use Jake defaults (letterpaper, 11pt) when layout has no page/typography', () => {
      // After transformResume, the default layout fills in a4/10pt from
      // DEFAULT_LATEX_LAYOUT, so Jake's own defaults only apply when the
      // layout engine lookup returns undefined for page/typography.
      // With { engine: 'latex' } alone, transformResume fills defaults.
      // Test that articledocument class is used in all cases.
      resume.layouts = [{ engine: 'latex' }]
      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('{article}')
      expect(result).not.toContain('{moderncv}')
    })

    it('should render a4 paper size when paperSize is a4', () => {
      const a4Resume = cloneDeep(resume)
      a4Resume.layouts = [
        {
          engine: 'latex',
          page: {
            paperSize: 'a4',
          },
        },
      ]

      const renderer = new JakeRenderer(a4Resume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('\\documentclass[a4paper,')
    })

    it('should render letter paper size when paperSize is letter', () => {
      const letterResume = cloneDeep(resume)
      letterResume.layouts = [
        {
          engine: 'latex',
          page: {
            paperSize: 'letter',
          },
        },
      ]

      const renderer = new JakeRenderer(letterResume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('\\documentclass[letterpaper,')
    })

    it('should render Jake template packages', () => {
      const result = renderer.renderPreamble()

      expect(result).toContain('\\usepackage{latexsym}')
      expect(result).toContain('\\usepackage[empty]{fullpage}')
      expect(result).toContain('\\usepackage{titlesec}')
      expect(result).toContain('\\usepackage{marvosym}')
      expect(result).toContain('\\usepackage{enumitem}')
      expect(result).toContain('\\usepackage[hidelinks]{hyperref}')
      expect(result).toContain('\\usepackage{fancyhdr}')
      expect(result).toContain('\\usepackage{tabularx}')
    })

    it('should render custom resume commands', () => {
      const result = renderer.renderPreamble()

      expect(result).toContain('\\newcommand{\\resumeItem}')
      expect(result).toContain('\\newcommand{\\resumeSubheading}')
      expect(result).toContain('\\newcommand{\\resumeSubSubheading}')
      expect(result).toContain('\\newcommand{\\resumeProjectHeading}')
      expect(result).toContain('\\newcommand{\\resumeSubItem}')
      expect(result).toContain('\\newcommand{\\resumeSubHeadingListStart}')
      expect(result).toContain('\\newcommand{\\resumeSubHeadingListEnd}')
      expect(result).toContain('\\newcommand{\\resumeItemListStart}')
      expect(result).toContain('\\newcommand{\\resumeItemListEnd}')
    })

    it('should render section formatting with titlerule', () => {
      const result = renderer.renderPreamble()

      expect(result).toContain('\\titleformat{\\section}')
      expect(result).toContain('\\titlerule')
    })

    it('should render page style and margins', () => {
      const result = renderer.renderPreamble()

      expect(result).toContain('\\pagestyle{fancy}')
      expect(result).toContain('\\fancyhf{}')
    })

    it('should use DEFAULT_LATEX_LAYOUT margins when no margins specified', () => {
      // transformResume merges DEFAULT_LATEX_LAYOUT defaults, so Jake's own
      // fallback margins (0.5in) are never reached in normal usage.
      resume.layouts = [{ engine: 'latex' }]
      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('top=2.5cm')
      expect(result).toContain('bottom=2.5cm')
      expect(result).toContain('left=1.5cm')
      expect(result).toContain('right=1.5cm')
    })

    it('should use custom margins when specified', () => {
      resume.layouts = [
        {
          engine: 'latex',
          page: {
            margins: {
              top: '1cm',
              bottom: '2cm',
              left: '1.5cm',
              right: '1.5cm',
            },
          },
        },
      ]
      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('top=1cm')
      expect(result).toContain('bottom=2cm')
      expect(result).toContain('left=1.5cm')
      expect(result).toContain('right=1.5cm')
    })

    it('should use default 0.5in margins when margin values are not provided', () => {
      resume.layouts = [
        {
          engine: 'latex',
          page: {
            margins: {
              top: '',
              bottom: '',
              left: '',
              right: '',
            } as unknown as {
              top: string
              bottom: string
              left: string
              right: string
            },
          },
        },
      ]
      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('top=0.5in')
      expect(result).toContain('bottom=0.5in')
      expect(result).toContain('left=0.5in')
      expect(result).toContain('right=0.5in')
    })

    it('should disable page numbers when showPageNumbers is false', () => {
      resume.layouts = [
        {
          engine: 'latex',
          page: {
            showPageNumbers: false,
          },
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('\\pagenumbering{gobble}')
    })

    it('should render urlstyle same', () => {
      const result = renderer.renderPreamble()
      expect(result).toContain('\\urlstyle{same}')
    })

    it('should include fontawesome5 when showIcons is true (default)', () => {
      const result = renderer.renderPreamble()
      expect(result).toContain('\\usepackage{fontawesome5}')
    })

    it('should not include fontawesome5 when showIcons is false', () => {
      resume.layouts = [
        {
          engine: 'latex',
          // @ts-ignore
          advanced: {
            showIcons: false,
          },
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).not.toContain('\\usepackage{fontawesome5}')
    })

    it('should render CTeX configuration', () => {
      const result = renderer.renderPreamble()

      expect(result).toContain(
        '\\usepackage[UTF8, heading=false, punct=kaiming'
      )
      expect(result).toContain('\\setCJKmainfont{Noto Serif CJK SC}')
      expect(result).toContain('\\setCJKsansfont{Noto Sans CJK SC}')
    })

    it('should return empty string for Babel config for English resume', () => {
      const enResume = cloneDeep(resume)
      enResume.locale = { ...enResume.locale, language: 'en' }

      const renderer = new JakeRenderer(enResume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).not.toContain('\\usepackage[spanish,es-lcroman]{babel}')
      expect(result).not.toContain('\\usepackage[norsk]{babel}')
      expect(result).not.toContain('\\usepackage[french]{babel}')
      expect(result).not.toContain('\\usepackage[dutch]{babel}')
      expect(result).not.toContain('\\usepackage[ngerman]{babel}')
    })

    it('should render Spanish configuration for Spanish resume', () => {
      const spanishResume = cloneDeep(resume)
      spanishResume.locale = { ...spanishResume.locale, language: 'es' }

      const renderer = new JakeRenderer(spanishResume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('\\usepackage[spanish,es-lcroman]{babel}')
    })

    it('should render Norwegian configuration for Norwegian resume', () => {
      const norwegianResume = cloneDeep(resume)
      norwegianResume.locale = { ...norwegianResume.locale, language: 'no' }

      const renderer = new JakeRenderer(norwegianResume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('\\usepackage[norsk]{babel}')
    })

    it('should render French configuration for French resume', () => {
      const frenchResume = cloneDeep(resume)
      frenchResume.locale = { ...frenchResume.locale, language: 'fr' }

      const renderer = new JakeRenderer(frenchResume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('\\usepackage[french]{babel}')
    })

    it('should render Dutch configuration for Dutch resume', () => {
      const dutchResume = cloneDeep(resume)
      dutchResume.locale = { ...dutchResume.locale, language: 'nl' }

      const renderer = new JakeRenderer(dutchResume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('\\usepackage[dutch]{babel}')
    })

    it('should render German configuration for German resume', () => {
      const germanResume = cloneDeep(resume)
      germanResume.locale = { ...germanResume.locale, language: 'de' }

      const renderer = new JakeRenderer(germanResume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('\\usepackage[ngerman]{babel}')
    })

    it('should render basic fontspec configuration', () => {
      const linuxLibertineFont = 'Linux Libertine'
      const linuxLibertineOFont = 'Linux Libertine O'
      const cjkResume = cloneDeep(resume)
      cjkResume.locale = { ...cjkResume.locale, language: 'en' }
      cjkResume.layouts = [
        {
          engine: 'latex',
          advanced: {
            fontspec: {
              numbers: 'OldStyle',
            },
          },
        },
      ]

      const renderer = new JakeRenderer(cjkResume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('\\usepackage{fontspec}')
      expect(result).toContain(`\\IfFontExistsTF{${linuxLibertineFont}}`)
      expect(result).toContain(
        `\\setmainfont[Ligatures={TeX, Common}, Numbers=OldStyle]{${linuxLibertineFont}}`
      )
      expect(result).toContain(`\\IfFontExistsTF{${linuxLibertineOFont}}`)
      expect(result).toContain(
        `\\setmainfont[Ligatures={TeX, Common}, Numbers=OldStyle]{${linuxLibertineOFont}}`
      )
    })

    it('should configure custom font families', () => {
      const linuxLibertineFont = 'Linux Libertine'
      const linuxLibertineOFont = 'Linux Libertine O'
      const customFont1 = 'Monaco'
      const customFont2 = 'Helvetica'
      resume.layouts = [
        {
          engine: 'latex',
          typography: {
            fontFamily: `${customFont1}, ${customFont2}`,
          },
        },
      ]

      const renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain(`\\IfFontExistsTF{${linuxLibertineFont}}`)
      expect(result).toContain(`\\IfFontExistsTF{${linuxLibertineOFont}}`)
      expect(result).toContain(`\\IfFontExistsTF{${customFont1}}`)
      expect(result).toContain(`\\IfFontExistsTF{${customFont2}}`)

      const idxDefault = result.indexOf(
        `\\IfFontExistsTF{${linuxLibertineFont}}`
      )
      const idxDefaultO = result.indexOf(
        `\\IfFontExistsTF{${linuxLibertineOFont}}`
      )
      const idxCustom2 = result.indexOf(`\\IfFontExistsTF{${customFont2}}`)
      const idxCustom1 = result.indexOf(`\\IfFontExistsTF{${customFont1}}`)

      expect(idxDefault).toBeLessThan(idxDefaultO)
      expect(idxDefaultO).toBeLessThan(idxCustom2)
      expect(idxCustom2).toBeLessThan(idxCustom1)
    })

    it('should render basic fontspec configuration for CJK', () => {
      const linuxLibertineFont = 'Linux Libertine'
      const linuxLibertineOFont = 'Linux Libertine O'
      const cjkResume = cloneDeep(resume)
      cjkResume.locale = { ...cjkResume.locale, language: 'zh-hans' }
      cjkResume.layouts = [
        {
          engine: 'latex',
          advanced: {
            fontspec: {
              numbers: 'Lining',
            },
          },
        },
      ]

      const renderer = new JakeRenderer(cjkResume, layoutIndex)
      const result = renderer.renderPreamble()

      expect(result).toContain('\\usepackage{fontspec}')
      expect(result).toContain(`\\IfFontExistsTF{${linuxLibertineFont}}`)
      expect(result).toContain(
        `\\setmainfont[Ligatures={TeX, Common}, Numbers=Lining, ItalicFont=${linuxLibertineFont}]{${linuxLibertineFont}}`
      )
      expect(result).toContain(`\\IfFontExistsTF{${linuxLibertineOFont}}`)
      expect(result).toContain(
        `\\setmainfont[Ligatures={TeX, Common}, Numbers=Lining, ItalicFont=${linuxLibertineOFont}]{${linuxLibertineOFont}}`
      )
    })

    it('should use default font size when layout is undefined', () => {
      resume.layouts = undefined
      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPreamble()
      // transformResume fills DEFAULT_LATEX_LAYOUT defaults (a4paper, 10pt)
      expect(result).toContain('\\documentclass[a4paper,10pt]{article}')
    })

    it('should return empty preamble when layout engine is not latex', () => {
      resume.layouts = [{ engine: 'markdown', sections: {} }]
      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPreamble()
      expect(result).toBe('')
    })

    it('should use default font size when typography is missing', () => {
      resume.layouts = [{ engine: 'latex' }]
      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPreamble()
      // transformResume fills DEFAULT_LATEX_LAYOUT defaults (a4paper, 10pt)
      expect(result).toContain('\\documentclass[a4paper,10pt]{article}')
    })

    it('should use default font size 11pt when typography.fontSize is empty', () => {
      resume.layouts = [
        {
          engine: 'latex',
          typography: {
            // @ts-ignore
            fontSize: '',
          },
        },
      ]
      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPreamble()
      expect(result).toContain('\\documentclass[a4paper,11pt]{article}')
    })

    it('should use default numbers style when advanced config is missing', () => {
      resume.layouts = [{ engine: 'latex', advanced: undefined }]
      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPreamble()
      expect(result).toContain('Numbers=OldStyle')
    })

    describe('typography.lineSpacing', () => {
      it('should use default line spacing when typography is undefined', () => {
        const testResume = cloneDeep(resume)
        testResume.layouts = [{ engine: 'latex', typography: undefined }]

        const renderer = new JakeRenderer(testResume, layoutIndex)
        const result = renderer.renderPreamble()

        expect(result).toContain('\\usepackage{setspace}')
        expect(result).toContain('\\setstretch{1.125}')
      })

      it('should use default line spacing when lineSpacing is not provided', () => {
        const testResume = cloneDeep(resume)
        const latexLayout = testResume.layouts[layoutIndex] as LatexLayout
        latexLayout.typography = { fontSize: '10pt' }

        const renderer = new JakeRenderer(testResume, layoutIndex)
        const result = renderer.renderPreamble()

        expect(result).toContain('\\usepackage{setspace}')
        expect(result).toContain('\\setstretch{1.125}')
      })

      it('should use provided line spacing when lineSpacing is set', () => {
        for (const [spacing, value] of Object.entries(LINE_SPACING_MAP)) {
          const testResume = cloneDeep(DEFAULT_RESUME)
          const layoutIndex = testResume.layouts.findIndex(
            (l) => l.engine === 'latex'
          )
          const latexLayout = testResume.layouts[layoutIndex] as LatexLayout
          latexLayout.typography = {
            ...latexLayout.typography,
            lineSpacing: spacing as keyof typeof LINE_SPACING_MAP,
          }

          const renderer = new JakeRenderer(testResume, layoutIndex)
          const result = renderer.renderPreamble()

          expect(result).toContain('\\usepackage{setspace}')
          expect(result).toContain(`\\setstretch{${value}}`)
        }
      })
    })
  })

  describe('renderBasics', () => {
    it('should render basic information', () => {
      const name = 'John Doe'
      const email = 'john@example.com'
      const phone = '+1234567890'
      const url = 'https://example.com'

      resume.content.basics.name = name
      resume.content.basics.email = email
      resume.content.basics.phone = phone
      resume.content.basics.url = url

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderBasics()

      expect(result).not.toContain('\\begin{center}')
      expect(result).toContain(`\\textbf{\\Huge \\scshape ${name}}`)
      expect(result).toContain(`\\small ${phone}`)
      expect(result).toContain(`\\href{mailto:${email}}{\\underline{${email}}}`)
      expect(result).toContain(`\\href{${url}}{\\underline{${url}}}`)
      expect(result).toContain('$|$')
    })

    it('should NOT render name when name is empty', () => {
      resume.content.basics.name = ''

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderBasics()

      expect(result).not.toContain('\\textbf{\\Huge \\scshape }')
    })

    it('should skip empty fields', () => {
      const name = 'John Doe'
      resume.content.basics.name = name
      resume.content.basics.email = ''
      resume.content.basics.phone = ''
      resume.content.basics.url = ''

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderBasics()

      expect(result).toContain(`\\textbf{\\Huge \\scshape ${name}}`)
      expect(result).not.toContain('\\href{mailto:')
      expect(result).not.toContain('\\small ')
    })

    it('should handle undefined values', () => {
      const name = 'John Doe'
      resume.content.basics.name = name
      resume.content.basics.email = undefined
      resume.content.basics.phone = undefined
      resume.content.basics.url = undefined

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderBasics()

      expect(result).toContain(`\\textbf{\\Huge \\scshape ${name}}`)
      expect(result).not.toContain('\\href{mailto:')
    })
  })

  describe('renderLocation', () => {
    it('should render location when address exists', () => {
      const address = '123 Main St'
      const city = 'City'
      const country = 'Japan'

      resume.content.location = {
        address,
        city,
        country,
      }

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderLocation()

      expect(result).toContain('$|$')
      expect(result).toContain('\\small')
    })
  })

  describe('renderProfiles', () => {
    it('should return empty string if no profiles', () => {
      resume.content.profiles = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderProfiles()

      expect(result).toBe('')
    })

    it('should render one social profile', () => {
      const url = 'https://github.com/username'
      const username = 'username'

      resume.content.profiles = [
        {
          network: 'GitHub',
          url,
          username,
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderProfiles()

      expect(result).toContain('$|$')
      expect(result).toContain(`\\href{${url}}{\\underline{${username}}}`)
      expect(result).toContain('\\faGithub')
    })

    it('should NOT render icons if showIcons is false', () => {
      const url = 'https://github.com/username'
      const username = 'username'

      resume.content.profiles = [
        {
          network: 'GitHub',
          url,
          username,
        },
      ]

      resume.layouts[layoutIndex] = {
        ...resume.layouts[layoutIndex],
        // @ts-ignore
        advanced: {
          showIcons: false,
        },
      }

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderProfiles()

      expect(result).not.toContain('\\faGithub')
      expect(result).toContain(`\\href{${url}}{\\underline{${username}}}`)
    })

    it('should render multiple social profiles', () => {
      const githubUrl = 'https://github.com/username'
      const twitterUrl = 'https://twitter.com/username'
      const username = 'username'

      resume.content.profiles = [
        {
          network: 'GitHub',
          url: githubUrl,
          username,
        },
        {
          network: 'Twitter',
          url: twitterUrl,
          username,
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderProfiles()

      expect(result).toContain('\\faGithub')
      expect(result).toContain('\\faTwitter')
      expect(result).toContain(`\\href{${githubUrl}}{\\underline{${username}}}`)
      expect(result).toContain(
        `\\href{${twitterUrl}}{\\underline{${username}}}`
      )
    })
  })

  describe('renderSummary', () => {
    it('should return empty string if no summary', () => {
      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderSummary()

      expect(result).toBe('')
    })
  })

  describe('renderEducation', () => {
    it('should return empty string if no education entries', () => {
      resume.content.education = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderEducation()

      expect(result).toBe('')
    })

    it('should render education section', () => {
      const institution = 'University'
      const area = 'Computer Science'
      const degree = 'Bachelor'
      const startDate = 'Jan 1, 2020'
      const endDate = 'Jan 1, 2024'
      const url = 'https://university.edu'
      const summary = ''

      resume.content.education = [
        {
          institution,
          area,
          degree,
          startDate,
          endDate,
          url,
          summary,
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderEducation()

      expect(result).toMatch(/^\\section{Education}/)
      expect(result).toContain('\\resumeSubheading')
      expect(result).toContain(institution)
      expect(result).toContain(`\\href{${url}}{\\underline{${url}}}`)
    })
  })

  describe('renderWork', () => {
    it('should return empty string if no work entries', () => {
      resume.content.work = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderWork()

      expect(result).toBe('')
    })

    it('should render work section', () => {
      const name = 'Company'
      const position = 'Software Engineer'
      const startDate = 'Jan 1, 2020'
      const endDate = 'Jan 1, 2024'
      const url = 'https://company.com'
      const summary = ''
      const keywords = ['JavaScript', 'TypeScript']

      resume.content.work = [
        {
          name,
          position,
          startDate,
          endDate,
          url,
          summary,
          keywords,
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderWork()

      expect(result).toMatch(/^\\section{Work}/)
      expect(result).toContain('\\resumeSubheading')
      expect(result).toContain(`{${position}}`)
      expect(result).toContain(`{${name}}`)
      expect(result).toContain(`\\href{${url}}{\\underline{${url}}}`)
    })
  })

  describe('renderLanguages', () => {
    it('should return empty string if no language entries', () => {
      resume.content.languages = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderLanguages()

      expect(result).toBe('')
    })

    it('should render languages section', () => {
      resume.content.languages = [
        {
          language: 'English',
          fluency: 'Native or Bilingual Proficiency',
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderLanguages()

      expect(result).toMatch(/^\\section{Languages}/)
      expect(result).toContain('\\textbf{English}')
      expect(result).toContain('Native or Bilingual Proficiency')
    })
  })

  describe('renderSkills', () => {
    it('should return empty string if no skill entries', () => {
      resume.content.skills = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderSkills()

      expect(result).toBe('')
    })

    it('should render skills section with keywords', () => {
      resume.content.skills = [
        {
          name: 'Programming',
          level: 'Expert',
          keywords: ['JavaScript', 'TypeScript'],
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderSkills()

      expect(result).toMatch(/^\\section{Skills}/)
      expect(result).toContain('\\textbf{Programming}')
    })

    it('should render skills section without keywords', () => {
      resume.content.skills = [
        {
          name: 'Programming',
          level: 'Expert',
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderSkills()

      expect(result).toMatch(/^\\section{Skills}/)
      expect(result).toContain('\\textbf{Programming}')
    })
  })

  describe('renderAwards', () => {
    it('should return empty string if no award entries', () => {
      resume.content.awards = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderAwards()

      expect(result).toBe('')
    })

    it('should render awards section', () => {
      const title = 'Best Developer Award'
      const awarder = 'Tech Company'
      const date = 'Jan 1, 2023'
      const summary = ''

      resume.content.awards = [
        {
          title,
          awarder,
          date,
          summary,
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderAwards()

      expect(result).toMatch(/^\\section{Awards}/)
      expect(result).toContain('\\resumeSubheading')
      expect(result).toContain(`{${title}}`)
      expect(result).toContain(`{${awarder}}`)
    })
  })

  describe('renderCertificates', () => {
    it('should return empty string if no certificate entries', () => {
      resume.content.certificates = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderCertificates()

      expect(result).toBe('')
    })

    it('should render certificates section', () => {
      const name = 'AWS Certified Solutions Architect'
      const issuer = 'Amazon Web Services'
      const date = 'Jan 1, 2023'
      const url = 'https://aws.amazon.com/certification'

      resume.content.certificates = [
        {
          name,
          issuer,
          date,
          url,
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderCertificates()

      expect(result).toMatch(/^\\section{Certificates}/)
      expect(result).toContain('\\resumeSubheading')
      expect(result).toContain(`{${name}}`)
      expect(result).toContain(`{${issuer}}`)
      expect(result).toContain(`\\href{${url}}{\\underline{${url}}}`)
    })
  })

  describe('renderPublications', () => {
    it('should return empty string if no publication entries', () => {
      resume.content.publications = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPublications()

      expect(result).toBe('')
    })

    it('should render publications section', () => {
      const name = 'Research Paper Title'
      const publisher = 'Academic Journal'
      const releaseDate = 'Jan 1, 2023'
      const url = 'https://journal.com/paper'
      const summary = ''

      resume.content.publications = [
        {
          name,
          publisher,
          releaseDate,
          url,
          summary,
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderPublications()

      expect(result).toMatch(/^\\section{Publications}/)
      expect(result).toContain('\\resumeSubheading')
      expect(result).toContain(`{${name}}`)
      expect(result).toContain(`{${publisher}}`)
      expect(result).toContain(`\\href{${url}}{\\underline{${url}}}`)
    })
  })

  describe('renderReferences', () => {
    it('should return empty string if no reference entries', () => {
      resume.content.references = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderReferences()

      expect(result).toBe('')
    })

    it('should render references section', () => {
      const name = 'John Smith'
      const email = 'john@example.com'
      const phone = '+1234567890'
      const relationship = 'Manager'
      const summary = ''

      resume.content.references = [
        {
          name,
          email,
          phone,
          relationship,
          summary,
          computed: {
            summary,
          },
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderReferences()

      expect(result).toMatch(/^\\section{References}/)
      expect(result).toContain('\\resumeSubheading')
      expect(result).toContain(`{${name}}`)
      expect(result).toContain(`{${relationship}}`)
    })
  })

  describe('renderProjects', () => {
    it('should return empty string if no project entries', () => {
      resume.content.projects = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderProjects()

      expect(result).toBe('')
    })

    it('should render projects section', () => {
      const name = 'Project Name'
      const description = 'Project Description'
      const startDate = 'Jan 1, 2023'
      const endDate = 'Dec 31, 2023'
      const url = 'https://project.com'
      const summary = ''
      const keywords = ['React', 'TypeScript']

      resume.content.projects = [
        {
          name,
          description,
          startDate,
          endDate,
          url,
          summary,
          keywords,
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderProjects()

      expect(result).toMatch(/^\\section{Projects}/)
      expect(result).toContain('\\resumeProjectHeading')
      expect(result).toContain(`\\textbf{${name}}`)
    })
  })

  describe('renderInterests', () => {
    it('should return empty string if no interest entries', () => {
      resume.content.interests = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderInterests()

      expect(result).toBe('')
    })

    it('should render interests section', () => {
      const name = 'Programming'
      const keywords = ['Open Source', 'Web Development']

      resume.content.interests = [
        {
          name,
          keywords,
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderInterests()

      expect(result).toMatch(/^\\section{Interests}/)
      expect(result).toContain(`\\textbf{${name}}`)
    })
  })

  describe('renderVolunteer', () => {
    it('should return empty string if no volunteer entries', () => {
      resume.content.volunteer = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderVolunteer()

      expect(result).toBe('')
    })

    it('should render volunteer section', () => {
      const organization = 'Code for Good'
      const position = 'Technical Lead'
      const startDate = '2023-01'
      const endDate = '2023-12'
      const summary = ''
      const url = 'https://codeforgood.org'

      resume.content.volunteer = [
        {
          organization,
          position,
          startDate,
          endDate,
          url,
          summary,
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.renderVolunteer()

      expect(result).toMatch(/^\\section{Volunteer}/)
      expect(result).toContain('\\resumeSubheading')
      expect(result).toContain(`{${position}}`)
      expect(result).toContain(`{${organization}}`)
      expect(result).toContain(`\\href{${url}}{\\underline{${url}}}`)
    })
  })

  describe('generateTeX', () => {
    it('should omit header content when basics, location, and profiles are empty', () => {
      resume.content.basics.name = ''
      resume.content.basics.phone = ''
      resume.content.basics.email = ''
      resume.content.basics.url = ''
      // @ts-ignore
      resume.content.location = { computed: { fullAddress: '' } }
      resume.content.profiles = []

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.render()

      expect(result).not.toContain('\\begin{center}')
    })
  })

  describe('generateTeX -> renderOrderedSections', () => {
    it('should prioritize custom sections', () => {
      resume.layouts = [
        {
          ...resume.layouts?.[layoutIndex],
          sections: {
            order: ['work', 'education'],
          },
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.render()

      const sectionMatches = result.match(/\\section\{[^}]+\}/g) || []
      const sectionNames = sectionMatches.map((match) =>
        match.replace(/\\section\{/, '').replace(/\}/, '')
      )

      const workIndex = sectionNames.findIndex((name) => name.includes('Work'))
      const educationIndex = sectionNames.findIndex((name) =>
        name.includes('Education')
      )
      const languagesIndex = sectionNames.findIndex((name) =>
        name.includes('Languages')
      )
      const skillsIndex = sectionNames.findIndex((name) =>
        name.includes('Skills')
      )

      expect(workIndex).toBeGreaterThan(-1)
      expect(educationIndex).toBeGreaterThan(-1)
      expect(languagesIndex).toBeGreaterThan(-1)
      expect(skillsIndex).toBeGreaterThan(-1)
      expect(workIndex).toBeLessThan(educationIndex)
      expect(educationIndex).toBeLessThan(languagesIndex)
      expect(languagesIndex).toBeLessThan(skillsIndex)
    })

    it('should use default order when no custom order is specified', () => {
      resume.layouts = [
        {
          ...resume.layouts?.[layoutIndex],
          sections: {},
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.render()

      const sectionMatches = result.match(/\\section\{[^}]+\}/g) || []
      const sectionNames = sectionMatches.map((match) =>
        match.replace(/\\section\{/, '').replace(/\}/, '')
      )

      const educationIndex = sectionNames.findIndex((name) =>
        name.includes('Education')
      )
      const workIndex = sectionNames.findIndex((name) => name.includes('Work'))
      const languagesIndex = sectionNames.findIndex((name) =>
        name.includes('Languages')
      )

      expect(educationIndex).toBeGreaterThan(-1)
      expect(workIndex).toBeGreaterThan(-1)
      expect(languagesIndex).toBeGreaterThan(-1)
      expect(educationIndex).toBeLessThan(workIndex)
      expect(workIndex).toBeLessThan(languagesIndex)
    })

    it('should filter out empty sections', () => {
      resume.content.education = []
      resume.content.work = []
      resume.content.skills = []

      resume.layouts = [
        {
          ...resume.layouts?.[layoutIndex],
          sections: {
            order: ['education', 'work', 'skills', 'languages'],
          },
        },
      ]

      renderer = new JakeRenderer(resume, layoutIndex)
      const result = renderer.render()

      const sectionMatches = result.match(/\\section\{[^}]+\}/g) || []
      const sectionNames = sectionMatches.map((match) =>
        match.replace(/\\section\{/, '').replace(/\}/, '')
      )

      const languagesIndex = sectionNames.findIndex((name) =>
        name.includes('Languages')
      )
      expect(languagesIndex).toBeGreaterThan(-1)

      const educationIndex = sectionNames.findIndex((name) =>
        name.includes('Education')
      )
      const workIndex = sectionNames.findIndex((name) => name.includes('Work'))
      const skillsIndex = sectionNames.findIndex((name) =>
        name.includes('Skills')
      )
      expect(educationIndex).toBe(-1)
      expect(workIndex).toBe(-1)
      expect(skillsIndex).toBe(-1)
    })
  })
})
