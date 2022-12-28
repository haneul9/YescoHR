sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/odata/ODataModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/odata/ServiceManager',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  function (
    // prettier 방지용 주석
    ODataModel,
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    ServiceManager,
    BaseController
  ) {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.hrDocument.Detail', {
      MODE: 'D',
      PRE_ROUTE_NAME: null,

      SIGNATURE_PAD_ID: 'signature-pad',

      initializeModel() {
        return {
          auth: 'E',
          mode: 'D',
          param: {},
          contentsBusy: {
            page: false,
            button: false,
            document: false,
            signature: false,
          },
          submitInfo: {
            Photo: '',
            Ename: '',
            Zzjikgbt: '', // Zzjikgbt/Zzjikcht
            Orgtx: '',
            Smdat: '',
            Pcip: '',
            Downcnt: '',
          },
          form: {
            Hrdocttl: '',
          },
          inputData: {},
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        this.MODE = oParameter.mode;
        this.PRE_ROUTE_NAME = _.chain(sRouteName).split('-', 1).head().value();

        const oViewModel = this.getViewModel();
        oViewModel.setData(this.initializeModel());

        try {
          this.setContentsBusy(true);

          oViewModel.setProperty('/auth', this.getCurrentAuthChar());
          oViewModel.setProperty('/mode', this.MODE);
          oViewModel.setProperty('/param', oParameter);

          await Promise.all([
            this.retrieveDocument(), //
            this.retrieveInputData(),
          ]);

          if (this.MODE === 'D') {
            this.setHtmlDocument();
          } else {
            this.transformDocument();
          }

          this.setSubmitInfo();
        } catch (oError) {
          this.debug('Controller > hrDocument Detail > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['page', 'button', 'signature']);
        }
      },

      setSubmitInfo() {
        const oViewModel = this.getViewModel();

        if (this.MODE === 'D') {
          const mFormData = oViewModel.getProperty('/form');

          oViewModel.setProperty('/submitInfo', {
            Photo: mFormData.Picurl,
            Ename: mFormData.Smname,
            Pcip: mFormData.Ipaddr,
            Zzjikgbt: _.chain([mFormData.Zzjikgbtx, mFormData.Zzjikchtx]).compact().join('/').value(),
            Orgtx: mFormData.Orgtx,
            Smdat: `${this.DateUtils.format(mFormData.Smdat)} ${this.TimeUtils.format(mFormData.Smtim)}`,
            Downcnt: `${_.toInteger(mFormData.Downcnt)}회`,
          });
        } else {
          oViewModel.setProperty('/submitInfo', {
            ..._.chain(this.getAppointeeData())
              .pick(['Pernr', 'Ename', 'Photo', 'Orgeh', 'Orgtx', 'Zzjikgbt', 'Zzjikcht', 'Pcip'])
              .tap((o) => _.set(o, 'Zzjikgbt', _.compact([o.Zzjikgbt, o.Zzjikcht]).join('/')))
              .value(),
          });
        }
      },

      setHtmlDocument() {
        const oViewModel = this.getViewModel();
        const sSmhtml = _.replace(oViewModel.getProperty('/form/Smhtml'), /<p class="page2break">.+?<\/p>/g, '<div class="page2break"></div>');
        const sWatermarkText = oViewModel.getProperty('/form/Watermk');

        $('.preview-box').html(sSmhtml);

        setTimeout(() => {
          const oPdfDomElement = document.getElementById(this.byId('preview-box-container').getId());

          this.PdfUtils.insertWatermark({ oPdfDomElement, sWatermarkText });
          this.setContentsBusy(false, 'document');
        }, 100);
      },

      transformDocument() {
        const oViewModel = this.getViewModel();

        try {
          const mInputData = oViewModel.getProperty('/inputData');
          let sHrdochtml = _.replace(oViewModel.getProperty('/form/Hrdochtml'), /<span class="empty-space">&nbsp;<\/span>/g, '');

          _.forOwn(mInputData, async (v, p) => {
            const rPattern = new RegExp(`<span[^>]+?data-placeholder-type=.+?@${p}.+?<\/span>`, 'gi');

            if (_.isEqual('5010', p)) {
              // 임금테이블
              const aRowData = _.split(v, '\\');
              const aTransformHtml = [];
              const sTrTemplate = `<tr class="contents" style="height: 35px;">
              <td style="width: 25%; border-right: 1pt solid #d9d9d9; border-bottom: 1pt solid #d9d9d9; border-left: 1pt solid #d9d9d9; border-image: initial; border-top: none; padding: 0cm 5.4pt; height: 24.1375px;">
              <p style="text-align: center; line-height: 15pt; word-break: keep-all; margin: 0cm 0cm 0.0001pt; font-size: 10pt; font-family: '맑은 고딕';">@text1</p></td>
              <td style="width: 20%; border-top: none; border-left: none; border-bottom: 1pt solid #d9d9d9; border-right: 1pt solid #d9d9d9; padding: 0cm 5.4pt; height: 24.1375px;">
              <p style="text-align: right; word-break: keep-all; margin: 0cm 0cm 0.0001pt; font-size: 10pt; font-family: '맑은 고딕';">@text2</p></td>
              <td style="width: 55%; border-top: none; border-left: none; border-bottom: 1pt solid #d9d9d9; border-right: 1pt solid #d9d9d9; padding: 0cm 5.4pt; height: 24.1375px;">
              <p style="text-align: left; margin: 0cm 0cm 0.0001pt; font-size: 10pt; font-family: '맑은 고딕';">@text3</p></td></tr>`;

              aRowData.forEach((row) => {
                const aCellData = _.split(row, '/');

                aTransformHtml.push(
                  _.chain(sTrTemplate)
                    .replace(/@text1/g, aCellData[0])
                    .replace(/@text2/g, aCellData[1])
                    .replace(/@text3/g, aCellData[2])
                    .value()
                );
              });

              sHrdochtml = _.replace(sHrdochtml, /<tr class=\"contents.+?<\/tr>/gis, _.join(aTransformHtml, ''));
            } else if (_.isEqual('1040', p)) {
              // 회사직인
              sHrdochtml = _.replace(sHrdochtml, rPattern, `<img src="data:image/bmp;base64,${btoa(v)}" style="max-width:100%;height:auto;" />`);
            } else if (_.isEqual('1050', p)) {
              // 본인서명
              const sReplaceTag = !!v ? `<img src="${v}" style="max-width:100%;height:auto;" />` : `<img class="preview-signature" style="max-width:100%;height:auto;" />`;

              sHrdochtml = _.replace(sHrdochtml, rPattern, sReplaceTag);
            } else {
              sHrdochtml = _.replace(sHrdochtml, rPattern, `<span style="font-size: 10pt;">${v}</span>`);
            }
          });

          setTimeout(() => {
            $('.preview-box').html(sHrdochtml);
            this.setContentsBusy(false, 'document');
          }, 100);
        } catch (oError) {
          throw oError;
        }
      },

      generateSignature() {
        const oSignature = this.byId(this.SIGNATURE_PAD_ID);
        const sSignatureDataUrl = oSignature.getDataUrl();

        document.querySelectorAll('.preview-signature').forEach((el) => {
          el.src = sSignatureDataUrl;
        });
      },

      validSignature() {
        const oSignature = this.byId(this.SIGNATURE_PAD_ID);

        if (!oSignature.isDraw()) {
          MessageBox.alert(this.getBundleText('MSG_20005')); // 서명을 입력하여 주십시오.
          return false;
        }

        return true;
      },

      getCsrfToken(oUploadModel) {
        oUploadModel.refreshSecurityToken();

        return oUploadModel._createRequest().headers['x-csrf-token'];
      },

      uploadFile({ sFileName, pdfBinary }) {
        const oViewModel = this.getViewModel();
        const sServiceUrl = ServiceManager.getServiceUrl('ZHR_PA_SRV');
        const sUploadUrl = `${sServiceUrl}/HrDocPdfSet/`;
        const oUploadModel = new ODataModel(sServiceUrl, { json: true, loadMetadataAsync: true, refreshAfterChange: false });
        const mFormData = oViewModel.getProperty('/form');
        const pdfFileObject = new File([pdfBinary], sFileName, { type: 'application/pdf', lastModified: new Date().getTime() });

        return new Promise((resolve, reject) => {
          const mHeaders = {
            'x-csrf-token': this.getCsrfToken(oUploadModel),
            slug: [mFormData.Werks, mFormData.Hrdoc, mFormData.Seqnr, mFormData.Pernr, `${encodeURI(sFileName)}`].join('|'),
          };

          $.ajax({
            url: sUploadUrl,
            dataType: 'json',
            type: 'POST',
            async: false,
            cache: false,
            processData: false,
            contentType: 'pdf',
            headers: mHeaders,
            data: pdfFileObject,
            success: (mData) => {
              AppUtils.debug(`${sUploadUrl} success.`, mData);

              resolve(mData.d);
            },
            error: (oError) => {
              AppUtils.debug(`${sUploadUrl} error.`, oError);

              const sMessage1 = AppUtils.getBundleText('MSG_00041'); // 파일 업로드를 실패하였습니다.
              const sMessage2 = AppUtils.getBundleText('MSG_00052', sFileName); // 파일명 : {0}

              reject({ code: 'E', message: `${sMessage1}\n\n${sMessage2}` });
            },
          });
        });
      },

      async createProcess() {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.PA);
          const mFormData = this.getViewModel().getProperty('/form');
          const sIpaddr = oViewModel.getProperty('/submitInfo/Pcip');
          const oPdfDomElement = document.getElementById(this.byId('preview-box-container').getId());
          const mAppointeeData = this.getAppointeeData();
          const sFileName = `${mFormData.Hrdocttl}_${mAppointeeData.Ename}_${mAppointeeData.Orgtx}_${moment().format('YYYYMMDDHHmmss')}.pdf`;
          const pdfBinary = await this.PdfUtils.getPdfBlob({ oPdfDomElement, mOption: { filename: sFileName } });
          const sDocHtml = oPdfDomElement.innerHTML;

          const { EZfilekey } = await this.uploadFile({ sFileName, pdfBinary });

          await Client.create(oModel, 'HrDocSubmit', {
            Prcty: 'S',
            Actty: oViewModel.getProperty('/auth'),
            ..._.chain(mFormData).pick(['Werks', 'Pernr', 'Hrdoc', 'Seqnr', 'Begda', 'Endda', 'Hrdocttl']).omitBy(_.isNil).value(),
            Ipaddr: sIpaddr,
            Smhtml: sDocHtml,
            Pdffile: EZfilekey,
          });

          // {제출}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', this.getBundleText('LABEL_49003')), {
            onClose: () => this.getRouter().navTo(this.PRE_ROUTE_NAME),
          });
        } catch (oError) {
          throw oError;
        }
      },

      async countPDFDownload() {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.PA);
          const mFormData = this.getViewModel().getProperty('/form');

          await Client.create(oModel, 'HrDocSubmit', {
            Prcty: 'D',
            Actty: oViewModel.getProperty('/auth'),
            ..._.chain(mFormData).pick(['Werks', 'Pernr', 'Hrdoc', 'Seqnr']).omitBy(_.isNil).value(),
            Ipaddr: this.getAppointeeProperty('Pcip'),
          });
        } catch (oError) {
          throw oError;
        }
      },

      async retrieveDocument(bOnlyCount = false) {
        const oViewModel = this.getViewModel();

        try {
          const mParam = oViewModel.getProperty('/param');
          const sAuth = oViewModel.getProperty('/auth');

          const [mDetailData] = await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'HrDocSubmit', {
            Prcty: this.MODE === 'D' ? 'D' : 'S',
            Actty: sAuth,
            Werks: this.getAppointeeProperty('Werks'),
            Pernr: this.getAppointeeProperty('Pernr'),
            Hrdoc: mParam.hrdoc,
            Seqnr: mParam.seqnr,
          });

          if (!bOnlyCount) {
            oViewModel.setProperty('/form', mDetailData);
            oViewModel.setProperty('/submitInfo/Smdat', `${this.DateUtils.format(mDetailData.Smdat)} ${this.TimeUtils.format(mDetailData.Smtim)}`);
          }

          oViewModel.setProperty('/submitInfo/Downcnt', `${_.toInteger(mDetailData.Downcnt)}회`);
        } catch (oError) {
          throw oError;
        }
      },

      async retrieveInputData() {
        const oViewModel = this.getViewModel();

        try {
          const mParam = oViewModel.getProperty('/param');
          const sAuth = oViewModel.getProperty('/auth');

          const aInputData = await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'HrDocInputField', {
            Actty: sAuth,
            Werks: this.getAppointeeProperty('Werks'),
            Pernr: this.getAppointeeProperty('Pernr'),
            Hrdoc: mParam.hrdoc,
          });

          oViewModel.setProperty('/inputData', _.chain(aInputData).mapKeys('Ipfld').mapValues('Ipfldcont').value());
        } catch (oError) {
          throw oError;
        }
      },

      async onSave() {
        if (!this.validSignature()) return;

        this.setContentsBusy(true);

        // {제출}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_49003'), {
          actions: [this.getBundleText('LABEL_49003'), MessageBox.Action.CANCEL],
          onClose: async (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              this.setContentsBusy(false);
              return;
            }

            try {
              this.generateSignature();

              await this.createProcess();
            } catch (oError) {
              this.debug('Controller > hrDocument Detail > onSave Error', oError);

              AppUtils.handleError(oError);
            } finally {
              this.setContentsBusy(false);
            }
          },
        });
      },

      onDownload() {
        this.setContentsBusy(true);

        // PDF File로 다운로드 하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_49001'), {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          onClose: async (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              this.setContentsBusy(false);
              return;
            }

            try {
              await this.countPDFDownload();

              this.downloadCurrentPDF();
            } catch (oError) {
              this.setContentsBusy(false);
              this.debug('Controller > hrDocument Detail > onDownload Error', oError);

              AppUtils.handleError(oError);
            }
          },
        });
      },

      downloadCurrentPDF() {
        try {
          const oPdfDomElement = document.getElementById(this.byId('preview-box-container').getId());
          const mFormData = this.getViewModel().getProperty('/form');
          const mAppointeeData = this.getAppointeeData();

          const sFileName = `${mFormData.Hrdocttl}_${mFormData.Smname}_${mAppointeeData.Orgtx}_${moment().format('YYYYMMDDHHmmss')}`;

          this.PdfUtils.download({
            oPdfDomElement,
            mOption: { filename: sFileName },
            fCallback: async () => {
              await this.retrieveDocument(true);

              this.setContentsBusy(false);
            },
          });
        } catch (oError) {
          throw oError;
        }
      },

      onPressSignatureClear() {
        this.byId(this.SIGNATURE_PAD_ID).clear();
      },
    });
  }
);
