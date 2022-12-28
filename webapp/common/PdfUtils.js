sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
  ],
  function (
    // prettier 방지용 주석
    MessageBox,
    AppUtils
  ) {
    'use strict';

    const WATERMARK_NODE_ID = 'watermarkPrintNode';

    const PDF_OPTIONS = {
      margin: [10, 0, 0, 0],
      filename: 'hrdocument.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scrollY: 0, scrollX: 0, scale: 1, dpi: 96 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css'], before: '.page2break' },
    };

    return {
      download({ oPdfDomElement, sWatermarkText, mOption = {}, fCallback }) {
        if (sWatermarkText) this.insertWatermark({ oPdfDomElement, sWatermarkText });

        html2pdf()
          .set(_.assign(PDF_OPTIONS, mOption))
          .from(oPdfDomElement)
          .save()
          .then(() => {
            if (sWatermarkText) document.getElementById(WATERMARK_NODE_ID).remove();
            if (fCallback && typeof fCallback === 'function') fCallback();
          })
          .catch((ex) => {
            AppUtils.debug(ex);

            // PDF 파일 변환 중 오류가 발생했습니다.
            MessageBox.error(AppUtils.getBundleText('MSG_49002'), {
              onClose: () => location.reload(),
            });
          });
      },

      async getPdfBlob({ oPdfDomElement, sWatermarkText, mOption = {} }) {
        if (sWatermarkText) this.insertWatermark({ oPdfDomElement, sWatermarkText });

        return await html2pdf()
          .set(_.assign(PDF_OPTIONS, mOption))
          .from(oPdfDomElement)
          .output('blob')
          .catch((ex) => {
            AppUtils.debug(ex);

            // PDF 파일 변환 중 오류가 발생했습니다.
            MessageBox.error(AppUtils.getBundleText('MSG_49002'), {
              onClose: () => location.reload(),
            });
          });
      },

      insertWatermark({ oPdfDomElement, sWatermarkText }) {
        const mClientRect = oPdfDomElement.getBoundingClientRect();
        const iWatermarkHeight = _.toInteger(mClientRect.bottom) - _.toInteger(mClientRect.top);

        oPdfDomElement.insertBefore(this._getWatermarkNode(sWatermarkText, iWatermarkHeight), oPdfDomElement.firstChild);
      },

      _getWatermarkNode(sWatermarkText, iWatermarkHeight) {
        const xmlns = 'http://www.w3.org/2000/svg';
        let svgElem = document.createElementNS(xmlns, 'svg');

        svgElem.setAttributeNS(null, 'id', WATERMARK_NODE_ID);
        svgElem.setAttributeNS(null, 'width', '100%');
        svgElem.setAttributeNS(null, 'height', iWatermarkHeight ? `${iWatermarkHeight}px` : '100%');
        svgElem.style.position = 'absolute';
        svgElem.style.top = '0';
        svgElem.style.left = '0';

        let defs = document.createElementNS(xmlns, 'defs');
        let pattern = document.createElementNS(xmlns, 'pattern');

        pattern.setAttributeNS(null, 'id', 'textstripe');
        pattern.setAttributeNS(null, 'patternUnits', 'userSpaceOnUse');
        pattern.setAttributeNS(null, 'width', '400');
        pattern.setAttributeNS(null, 'height', '100');
        pattern.setAttributeNS(null, 'patternTransform', 'rotate(-45)');

        let text = document.createElementNS(xmlns, 'text');

        text.setAttributeNS(null, 'y', '60');
        text.setAttributeNS(null, 'font-size', '20');
        text.style.color = '#707070';
        text.style.opacity = '0.1';

        let textNode = document.createTextNode(sWatermarkText);

        text.appendChild(textNode);
        pattern.appendChild(text);
        defs.appendChild(pattern);

        let rect = document.createElementNS(xmlns, 'rect');

        rect.setAttributeNS(null, 'width', '100%');
        rect.setAttributeNS(null, 'height', '100%');
        rect.setAttributeNS(null, 'fill', 'url(#textstripe)');

        svgElem.appendChild(defs);
        svgElem.appendChild(rect);

        return svgElem;
      },
    };
  }
);
