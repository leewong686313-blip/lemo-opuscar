# Floute les textes anglais illisibles des illustrations
from PIL import Image, ImageFilter
R = {
 'factures': [(372,445,588,712),(588,752,698,818)],
 'courses':  [(440,615,600,785)],
 'voyage':   [(540,368,698,655),(578,800,668,962),(70,570,205,645)],
 'pack':     [(565,385,760,540),(675,860,755,955)],
 'tirelire': [(538,690,632,835)],
}
for name, boxes in R.items():
    im = Image.open(name+'.jpg').convert('RGB')
    for b in boxes:
        reg = im.crop(b).filter(ImageFilter.GaussianBlur(4))
        im.paste(reg, b[:2])
    im.save(name+'-net.jpg', quality=95)
Image.open('repas.jpg').convert('RGB').save('repas-net.jpg', quality=95)
