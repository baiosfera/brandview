import re

path = '/var/www/brandview/src/components/Step1Fonts.tsx'
with open(path, 'r') as f:
    content = f.read()

replacement = """
  const getNodeStyle = (cardId: string, itemId: string, defaultFont: string, defaultSize: number, defaultAlign: 'left' | 'center' | 'right' | 'justify' = 'center'): ElementStyle => {
    const key = `${cardId}_${itemId}`;
    if (!elementsStore[key]) {
      let baseStyle: Partial<ElementStyle> = {};
      if (itemId.includes('_w') || itemId.includes('_l')) {
        const parentId = itemId.split('_')[0];
        const parentKey = `${cardId}_${parentId}`;
        if (elementsStore[parentKey]) {
          baseStyle = { ...elementsStore[parentKey] };
          // Do not inherit positioning, otherwise words overlap exactly at parent's offset
          baseStyle.translateX = 0;
          baseStyle.translateY = 0;
          baseStyle.rotation = 0;
        }
      }

      setElementsStore(key, {
        text: '',
        fontSize: baseStyle.fontSize ?? defaultSize,
        letterSpacing: baseStyle.letterSpacing ?? (itemId === 'slogan' ? 0.15 : (itemId === 'initials' ? 0.02 : 0.04)),
        lineHeight: baseStyle.lineHeight ?? (itemId === 'initials' ? 1.0 : (itemId === 'body' ? 1.6 : 1.2)),
        fontFamily: baseStyle.fontFamily ?? defaultFont,
        textTransform: baseStyle.textTransform ?? (itemId === 'slogan' || itemId === 'initials' ? 'uppercase' : 'none'),
        fontWeight: baseStyle.fontWeight ?? 'normal',
        fontStyle: baseStyle.fontStyle ?? (itemId === 'h2' ? 'italic' : 'normal'),
        textAlign: baseStyle.textAlign ?? defaultAlign,
        ligatures: baseStyle.ligatures ?? true,
        translateX: 0,
        translateY: 0,
        rotation: 0,
        mirror: baseStyle.mirror ?? false
      });
    }
    return elementsStore[key];
  };
"""

content = re.sub(r'const getNodeStyle = \(.*?\): ElementStyle => \{[\s\S]*?return elementsStore\[key\];\n  \};', replacement.strip(), content)

with open(path, 'w') as f:
    f.write(content)
