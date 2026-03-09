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

import type { Parser } from '@/compiler'
import { MarkdownParser } from '@/compiler'
import type { LatexLayout, Resume } from '@/models'
import { transformResume } from '@/preprocess'
import { getTemplateTranslations } from '@/translations'
import {
  escapeLatex,
  isEmptyValue,
  joinNonEmptyString,
  showIf,
  showIfNotEmpty,
} from '@/utils'
import { LatexRenderer } from './base'
import { normalizeUnit } from './preamble'

/**
 * Renderer for Jake's Resume template.
 *
 * This template is based on the popular "Jake's Resume" LaTeX template
 * originally created by Jake Gutierrez and widely used on Overleaf.
 *
 * It uses the `article` document class with custom commands for resume
 * formatting, producing a clean, ATS-friendly layout with:
 * - Centered header with contact info separated by `$|$`
 * - Section headings with `\titlerule` dividers
 * - `tabular*` based subheadings for aligned date ranges
 * - Compact itemize lists for bullet points
 *
 * @see {@link https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs}
 * @see {@link https://github.com/jakeryang/resume}
 */
class JakeRenderer extends LatexRenderer {
  /**
   * Constructor for the JakeRenderer class.
   *
   * @param resume - The resume object
   * @param layoutIndex - The index of the selected layout to use.
   * @param summaryParser - The summary parser used to parse summary field in
   * various sections.
   */
  constructor(
    resume: Resume,
    layoutIndex: number,
    summaryParser: Parser = new MarkdownParser()
  ) {
    super(
      transformResume(resume, layoutIndex, summaryParser, escapeLatex),
      layoutIndex
    )
  }

  /**
   * Render the document class configuration.
   *
   * Uses the `article` document class, respecting user-configured paper size
   * and font size, with Jake's defaults of letterpaper and 11pt.
   */
  private renderDocumentClassConfig(): string {
    const layout = this.resume.layouts?.[this.layoutIndex]

    const fontSize = (layout as LatexLayout)?.typography?.fontSize || '11pt'

    const paperSize =
      (layout as LatexLayout)?.page?.paperSize === 'a4'
        ? 'a4paper'
        : 'letterpaper'

    return `\\documentclass[${paperSize},${normalizeUnit(fontSize)}]{article}`
  }

  /**
   * Render the LaTeX packages required by Jake's Resume template.
   */
  private renderPackages(): string {
    return `\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}`
  }

  /**
   * Render the page style and margin configuration.
   */
  private renderPageConfig(): string {
    const layout = this.resume.layouts?.[this.layoutIndex]
    const page = (layout as LatexLayout)?.page

    const margins = page?.margins
    const showPageNumbers = page?.showPageNumbers

    // Jake's defaults: 0.5in margins on all sides, with textheight adjusted
    const t = margins?.top ? normalizeUnit(margins.top) : '0.5in'
    const b = margins?.bottom ? normalizeUnit(margins.bottom) : '0.5in'
    const l = margins?.left ? normalizeUnit(margins.left) : '0.5in'
    const r = margins?.right ? normalizeUnit(margins.right) : '0.5in'

    return joinNonEmptyString(
      [
        `\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\usepackage[top=${t}, bottom=${b}, left=${l}, right=${r}]{geometry}`,
        showIf(
          !showPageNumbers,
          `
% Disable page numbers
\\pagenumbering{gobble}`
        ),
      ],
      '\n'
    )
  }

  /**
   * Render the section formatting configuration.
   */
  private renderSectionFormatting(): string {
    return `\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]`
  }

  /**
   * Render the custom resume commands used by Jake's template.
   */
  private renderCustomCommands(): string {
    return `%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}`
  }

  /**
   * Render the preamble for the resume.
   *
   * @returns The LaTeX code for the preamble
   */
  renderPreamble(): string {
    if (this.resume.layouts?.[this.layoutIndex]?.engine !== 'latex') {
      return ''
    }

    return joinNonEmptyString([
      this.renderDocumentClassConfig(),
      this.renderPackages(),

      // fontawesome5 for profile icons
      showIf(this.showIcons, '\\usepackage{fontawesome5}'),

      // page layout
      this.renderPageConfig(),

      // section formatting and custom commands
      this.renderSectionFormatting(),
      this.renderCustomCommands(),

      // language specific
      this.renderBabelConfig(),

      // fontspec
      this.renderFontspecConfig(),

      // CTeX for CJK
      this.renderCTeXConfig(),

      // line spacing
      this.renderLineSpacingConfig(),
    ])
  }

  /**
   * Render the basics section (centered header).
   *
   * @returns The LaTeX code for the heading
   */
  renderBasics(): string {
    const {
      content: {
        basics: { name, phone, email, url },
      },
    } = this.resume

    const contactParts: string[] = []

    if (!isEmptyValue(phone)) {
      contactParts.push(`\\small ${phone}`)
    }

    if (!isEmptyValue(email)) {
      contactParts.push(`\\href{mailto:${email}}{\\underline{${email}}}`)
    }

    if (!isEmptyValue(url)) {
      contactParts.push(`\\href{${url}}{\\underline{${url}}}`)
    }

    const headerLines: string[] = []

    if (!isEmptyValue(name)) {
      headerLines.push(
        `    \\textbf{\\Huge \\scshape ${name}} \\\\ \\vspace{1pt}`
      )
    }

    if (contactParts.length > 0) {
      headerLines.push(`    ${contactParts.join(' $|$ ')}`)
    }

    return joinNonEmptyString(headerLines, '\n')
  }

  /**
   * Render the location inline in the header.
   *
   * For Jake's template, location is rendered as part of the centered header.
   *
   * @returns The LaTeX code for the location
   */
  renderLocation(): string {
    const {
      content: {
        location: {
          computed: { fullAddress },
        },
      },
    } = this.resume

    return showIfNotEmpty(fullAddress, `$|$ \\small ${fullAddress}`)
  }

  /**
   * Render the profiles section inline in the header.
   *
   * @returns The LaTeX code for profiles
   */
  renderProfiles(): string {
    const {
      content: { profiles },
    } = this.resume

    const profileLinks = profiles
      .map(({ network, url, username }) => {
        const icon = this.getFaIcon(network)
        return isEmptyValue(username) || isEmptyValue(network)
          ? ''
          : `${icon}\\href{${url}}{\\underline{${username}}}`
      })
      .filter((link) => !isEmptyValue(link))

    if (!profileLinks.length) {
      return ''
    }

    return `$|$ ${profileLinks.join(' $|$ ')}`
  }

  /**
   * Render the summary section.
   *
   * @returns The LaTeX code for the summary section
   */
  renderSummary(): string {
    const {
      content: {
        basics: {
          computed: { summary },
        },
        computed: { sectionNames },
      },
    } = this.resume

    return showIfNotEmpty(
      summary,
      `\\section{${sectionNames.basics}}
  \\resumeSubHeadingListStart
    \\item\\small{${summary}}
  \\resumeSubHeadingListEnd`
    )
  }

  /**
   * Render the education section.
   *
   * @returns The LaTeX code for the education section
   */
  renderEducation(): string {
    const {
      content: {
        computed: { sectionNames },
        education,
      },
      locale,
    } = this.resume

    const {
      punctuations: { colon },
      terms,
    } = getTemplateTranslations(locale?.language)

    if (!education.length) {
      return ''
    }

    return `\\section{${sectionNames.education}}
  \\resumeSubHeadingListStart
${education
  .map(
    ({
      computed: { startDate, dateRange, degreeAreaAndScore, summary, courses },
      institution,
      url,
    }) =>
      joinNonEmptyString(
        [
          `    \\resumeSubheading
      {${institution}}{${showIfNotEmpty(url, `\\href{${url}}{\\underline{${url}}}`)}}
      {${degreeAreaAndScore}}{${showIfNotEmpty(startDate, dateRange)}}`,
          showIf(
            !isEmptyValue(summary) || !isEmptyValue(courses),
            `      \\resumeItemListStart
${joinNonEmptyString(
  [
    showIfNotEmpty(summary, `        \\resumeItem{${summary}}`),
    showIf(
      !isEmptyValue(courses),
      `        \\resumeItem{\\textbf{${terms.courses}}${colon}${courses}}`
    ),
  ],
  '\n'
)}
      \\resumeItemListEnd`
          ),
        ],
        '\n'
      )
  )
  .join('\n')}
  \\resumeSubHeadingListEnd`
  }

  /**
   * Render the work section.
   *
   * @returns The LaTeX code for the work section
   */
  renderWork(): string {
    const { content, locale } = this.resume

    const {
      punctuations: { colon },
      terms,
    } = getTemplateTranslations(locale?.language)

    if (!content.work.length) {
      return ''
    }

    return `\\section{${content.computed.sectionNames.work}}
  \\resumeSubHeadingListStart
${content.work
  .map((work) => {
    const {
      computed: { startDate, dateRange, summary, keywords },
      name,
      position,
      url,
    } = work

    return joinNonEmptyString(
      [
        `    \\resumeSubheading
      {${position}}{${showIfNotEmpty(startDate, dateRange)}}
      {${name}}{${showIfNotEmpty(url, `\\href{${url}}{\\underline{${url}}}`)}}`,
        showIf(
          !isEmptyValue(summary) || !isEmptyValue(keywords),
          `      \\resumeItemListStart
${joinNonEmptyString(
  [
    showIfNotEmpty(summary, `        \\resumeItem{${summary}}`),
    showIf(
      !isEmptyValue(keywords),
      `        \\resumeItem{\\textbf{${terms.keywords}}${colon}${keywords}}`
    ),
  ],
  '\n'
)}
      \\resumeItemListEnd`
        ),
      ],
      '\n'
    )
  })
  .join('\n')}
  \\resumeSubHeadingListEnd`
  }

  /**
   * Render the languages section.
   *
   * Uses Jake's Technical Skills pattern with label: value format.
   *
   * @returns The LaTeX code for the languages section
   */
  renderLanguages(): string {
    const {
      content: {
        computed: { sectionNames },
        languages,
      },
      locale,
    } = this.resume

    if (!languages.length) {
      return ''
    }

    const {
      punctuations: { colon },
    } = getTemplateTranslations(locale?.language)

    return `\\section{${sectionNames.languages}}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${languages
  .map(
    ({ computed: { language, fluency } }) =>
      `     \\textbf{${language}}${showIfNotEmpty(fluency, `${colon}${fluency}`)} \\\\`
  )
  .join('\n')}
    }}
 \\end{itemize}`
  }

  /**
   * Render the skills section.
   *
   * Uses Jake's Technical Skills pattern with label: keywords format.
   *
   * @returns The LaTeX code for the skills section
   */
  renderSkills(): string {
    const {
      content: {
        computed: { sectionNames },
        skills,
      },
      locale,
    } = this.resume

    if (!skills.length) {
      return ''
    }

    const {
      punctuations: { colon },
    } = getTemplateTranslations(locale?.language)

    return `\\section{${sectionNames.skills}}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${skills
  .map(({ name, computed: { keywords } }) =>
    joinNonEmptyString(
      [
        `     \\textbf{${name}}`,
        showIfNotEmpty(keywords, `${colon}${keywords}`),
        ' \\\\',
      ],
      ''
    )
  )
  .join('\n')}
    }}
 \\end{itemize}`
  }

  /**
   * Render the awards section.
   *
   * @returns The LaTeX code for the awards section
   */
  renderAwards(): string {
    const {
      content: {
        computed: { sectionNames },
        awards,
      },
    } = this.resume

    if (!awards.length) {
      return ''
    }

    return `\\section{${sectionNames.awards}}
  \\resumeSubHeadingListStart
${awards
  .map(({ computed: { date, summary }, awarder, title }) =>
    joinNonEmptyString(
      [
        `    \\resumeSubheading
      {${title}}{${date}}
      {${awarder}}{}`,
        showIfNotEmpty(
          summary,
          `      \\resumeItemListStart
        \\resumeItem{${summary}}
      \\resumeItemListEnd`
        ),
      ],
      '\n'
    )
  )
  .join('\n')}
  \\resumeSubHeadingListEnd`
  }

  /**
   * Render the certificates section.
   *
   * @returns The LaTeX code for the certificates section
   */
  renderCertificates(): string {
    const {
      content: {
        computed: { sectionNames },
        certificates,
      },
    } = this.resume

    if (!certificates.length) {
      return ''
    }

    return `\\section{${sectionNames.certificates}}
  \\resumeSubHeadingListStart
${certificates
  .map(
    ({ computed: { date }, issuer, name, url }) =>
      `    \\resumeSubheading
      {${name}}{${date}}
      {${issuer}}{${showIfNotEmpty(url, `\\href{${url}}{\\underline{${url}}}`)}}`
  )
  .join('\n')}
  \\resumeSubHeadingListEnd`
  }

  /**
   * Render the publications section.
   *
   * @returns The LaTeX code for the publications section
   */
  renderPublications(): string {
    const {
      content: {
        computed: { sectionNames },
        publications,
      },
    } = this.resume

    if (!publications.length) {
      return ''
    }

    return `\\section{${sectionNames.publications}}
  \\resumeSubHeadingListStart
${publications
  .map(({ computed: { releaseDate, summary }, name, publisher, url }) =>
    joinNonEmptyString(
      [
        `    \\resumeSubheading
      {${name}}{${releaseDate}}
      {${publisher}}{${showIfNotEmpty(url, `\\href{${url}}{\\underline{${url}}}`)}}`,
        showIfNotEmpty(
          summary,
          `      \\resumeItemListStart
        \\resumeItem{${summary}}
      \\resumeItemListEnd`
        ),
      ],
      '\n'
    )
  )
  .join('\n')}
  \\resumeSubHeadingListEnd`
  }

  /**
   * Render the references section.
   *
   * @returns The LaTeX code for the references section
   */
  renderReferences(): string {
    const {
      content: {
        computed: { sectionNames },
        references,
      },
    } = this.resume

    if (!references.length) {
      return ''
    }

    return `\\section{${sectionNames.references}}
  \\resumeSubHeadingListStart
${references
  .map(({ email, relationship, name, phone, computed: { summary } }) =>
    joinNonEmptyString(
      [
        `    \\resumeSubheading
      {${name}}{${relationship}}
      {${joinNonEmptyString([email, phone], ' $|$ ')}}{}`,
        showIfNotEmpty(
          summary,
          `      \\resumeItemListStart
        \\resumeItem{${summary}}
      \\resumeItemListEnd`
        ),
      ],
      '\n'
    )
  )
  .join('\n')}
  \\resumeSubHeadingListEnd`
  }

  /**
   * Render the projects section.
   *
   * Uses the `\resumeProjectHeading` command for project name + keywords with
   * date range, matching Jake's original Projects section style.
   *
   * @returns The LaTeX code for the projects section
   */
  renderProjects(): string {
    const { content } = this.resume
    if (!content.projects.length) {
      return ''
    }

    return `\\section{${content.computed.sectionNames.projects}}
    \\resumeSubHeadingListStart
${content.projects
  .map(
    ({
      name,
      description,
      url,
      computed: { dateRange, startDate, summary, keywords },
    }) =>
      joinNonEmptyString(
        [
          `      \\resumeProjectHeading
          {\\textbf{${name}}${showIfNotEmpty(
            keywords,
            ` $|$ \\emph{${keywords}}`
          )}${showIfNotEmpty(
            description,
            ` -- ${description}`
          )}${showIfNotEmpty(
            url,
            ` $|$ \\href{${url}}{\\underline{${url}}}`
          )}}{${showIfNotEmpty(startDate, dateRange)}}`,
          showIf(
            !isEmptyValue(summary),
            `          \\resumeItemListStart
            \\resumeItem{${summary}}
          \\resumeItemListEnd`
          ),
        ],
        '\n'
      )
  )
  .join('\n')}
    \\resumeSubHeadingListEnd`
  }

  /**
   * Render the interests section.
   *
   * Uses Jake's Technical Skills pattern.
   *
   * @returns The LaTeX code for the interests section
   */
  renderInterests(): string {
    const { content, locale } = this.resume

    if (!content.interests.length) {
      return ''
    }

    const {
      punctuations: { colon },
    } = getTemplateTranslations(locale?.language)

    return `\\section{${content.computed.sectionNames.interests}}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${content.interests
  .map(
    ({ name, computed: { keywords } }) =>
      `     \\textbf{${name}}${showIfNotEmpty(keywords, `${colon}${keywords}`)} \\\\`
  )
  .join('\n')}
    }}
 \\end{itemize}`
  }

  /**
   * Render the volunteer section.
   *
   * @returns The LaTeX code for the volunteer section
   */
  renderVolunteer(): string {
    const { content } = this.resume

    if (!content.volunteer.length) {
      return ''
    }

    return `\\section{${content.computed.sectionNames.volunteer}}
  \\resumeSubHeadingListStart
${content.volunteer
  .map(
    ({
      position,
      organization,
      url,
      computed: { startDate, dateRange, summary },
    }) =>
      joinNonEmptyString(
        [
          `    \\resumeSubheading
      {${position}}{${showIfNotEmpty(startDate, dateRange)}}
      {${organization}}{${showIfNotEmpty(url, `\\href{${url}}{\\underline{${url}}}`)}}`,
          showIfNotEmpty(
            summary,
            `      \\resumeItemListStart
        \\resumeItem{${summary}}
      \\resumeItemListEnd`
          ),
        ],
        '\n'
      )
  )
  .join('\n')}
  \\resumeSubHeadingListEnd`
  }

  /**
   * Render the resume.
   *
   * @returns The LaTeX code for the resume
   */
  render(): string {
    return this.generateTeX()
  }

  /**
   * Generate the LaTeX code for the resume.
   *
   * Assembles the preamble, header (basics + location + profiles in a
   * centered block), and ordered sections into a complete LaTeX document.
   *
   * @returns The LaTeX code for the resume
   */
  private generateTeX(): string {
    const headerParts = [
      this.renderBasics(),
      this.renderLocation(),
      this.renderProfiles(),
    ].filter((part) => part.trim() !== '')

    // Join basics, location, and profiles into a single centered header block
    const headerContent =
      headerParts.length > 0
        ? `\\begin{center}
${headerParts.join('\n    ')}
\\end{center}`
        : ''

    return `${joinNonEmptyString([this.renderPreamble()])}

\\begin{document}

${headerContent}

${this.renderOrderedSections()}
\\end{document}`
  }
}

export { JakeRenderer }
