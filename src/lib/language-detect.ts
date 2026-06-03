export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return 'en';

  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';
  if (/[\u0590-\u05ff]/.test(text)) return 'he';

  const lower = text.toLowerCase();

  const frenchPattern = /\b(le|la|les|des|est|dans|avec|pour|sur|chez|elle|ils|nous|vous|leur|sont|mais|donc|car|rien|très|ce|cet|cette|ces|faire|être|avoir|je|tu|il|elle|nous|vous|ils|elles|un|une|du|au|aux|en|par|pas|plus|tout|fait|bien|comme|mon|ton|son|mes|tes|ses|nos|vos|leurs|de|d'|bonjour|merci|au|revoir|s'il|vous|plaît|conjuguez|traduisez|écrivez|lisez|répétez)\b/i;
  const frenchScore = (lower.match(frenchPattern) || []).length;

  const spanishPattern = /\b(el|la|los|las|del|con|por|para|una|unas|unos|este|esta|estos|estas|ese|esa|esos|esas|ser|estar|haber|tener|hacer|poder|decir|ir|ver|dar|saber|querer|llegar|pasar|deber|poner|parecer|quedar|creer|hablar|llevar|dejar|seguir|encontrar|llamar|como|más|pero|sus|le|ya|desde|entre|si|también|porque|así|bien|solo|cosa|tanto|nunca|muy|siempre|hasta|sobre|gracias|hola|adiós|señor|señora|señorita|conjuga|traduce|escribe|lee|repite)\b/i;
  const spanishScore = (lower.match(spanishPattern) || []).length;

  const germanPattern = /\b(der|die|das|den|dem|des|mit|und|sein|haben|werden|können|müssen|sagen|geben|kommen|sollen|wollen|gehen|wissen|sehen|lassen|stehen|finden|bleiben|liegen|heißen|denken|nehmen|tun|glauben|halten|nennen|bringen|arbeiten|bedeuten|sprechen|ein|eine|einer|eines|einem|einen|kein|keine|nicht|aber|oder|weil|denn|also|nur|noch|schon|sehr|auch|immer|wieder|hier|dort|jetzt|dann|endlich|vielleicht|natürlich|einfach|richtig|genau|ganz|als|beim|vom|zum|zur|aus|bei|nach|vor|durch|für|gegen|ohne|um|hallo|tschüss|danke|bitte|konjugieren|übersetzen|schreiben|lesen|wiederholen)\b/i;
  const germanScore = (lower.match(germanPattern) || []).length;

  const maxScore = Math.max(frenchScore, spanishScore, germanScore);
  if (maxScore === 0) return 'en';
  if (frenchScore === maxScore) return 'fr';
  if (spanishScore === maxScore) return 'es';
  if (germanScore === maxScore) return 'de';

  return 'en';
}
