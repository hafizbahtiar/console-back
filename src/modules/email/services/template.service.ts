import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class TemplateService {
  private readonly templatesPath: string;

  constructor() {
    // Resolve template path - works in both development and production
    // Try multiple paths to find templates
    const possiblePaths = [
      // Development: source folder
      join(process.cwd(), 'src', 'modules', 'email', 'templates'),
      // Production: dist folder (if templates are copied)
      join(process.cwd(), 'dist', 'modules', 'email', 'templates'),
      // Fallback: relative to compiled file location (go up from services/ to templates/)
      join(__dirname, '..', 'templates'),
      // Alternative: if services/ exists, go up from there
      join(__dirname, '..', '..', '..', 'modules', 'email', 'templates'),
    ];

    // Find the first path that exists
    const foundPath = possiblePaths.find((path) => existsSync(path));

    if (!foundPath) {
      // If no path found, use the source path as default (will fail gracefully with clear error)
      this.templatesPath = possiblePaths[0];
      console.warn(
        `Email templates directory not found. Using: ${this.templatesPath}. Make sure templates exist.`,
      );
    } else {
      this.templatesPath = foundPath;
    }
  }

  /**
   * Load and render email template
   * @param templateName - Name of the template file (without .html extension)
   * @param data - Data to replace in template (using {{variable}} syntax)
   */
  renderTemplate(
    templateName: string,
    data: Record<string, string | null>,
  ): string {
    try {
      const templatePath = join(this.templatesPath, `${templateName}.html`);
      let template = readFileSync(templatePath, 'utf-8');

      // Simple template replacement ({{variable}})
      Object.keys(data).forEach((key) => {
        const value = data[key] || '';
        // Replace {{key}} and {{#if key}}...{{/if}} patterns
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        template = template.replace(regex, value);

        // Handle {{#if variable}}...{{/if}} blocks
        const ifRegex = new RegExp(
          `\\{\\{#if ${key}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`,
          'g',
        );
        if (value) {
          template = template.replace(ifRegex, '$1');
        } else {
          template = template.replace(ifRegex, '');
        }
      });

      return template;
    } catch (error) {
      throw new Error(
        `Failed to load template ${templateName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get template path (for validation)
   */
  getTemplatePath(templateName: string): string {
    return join(this.templatesPath, `${templateName}.html`);
  }
}
