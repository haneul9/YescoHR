sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  function (
    // prettier 방지용 주석
    Fragment,
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    Validator,
    BaseController
  ) {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.documentTemplateMng.Preview', {
      MODE: 'N',
      PRE_ROUTE_NAME: null,

      EDITOR_ID: 'hrDocRTE',
      INPUT_FIELDS_TREE_ID: 'InputFieldsTree',

      initializeModel() {
        return {
          auth: 'E',
          editorBoxHeight: '500px',
          contentsBusy: {
            page: false,
            button: false,
            input: false,
            editor: false,
          },
          form: {
            Hrdoc: null,
            Hrdoctx: null,
            Begda: null,
            Endda: null,
            Hrdochtml: null,
            TempHrdochtml: null,
          },
          templates: [],
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
          oViewModel.setProperty('/listInfo/selectionMode', 'None');
          oViewModel.setProperty('/editorBoxHeight', `${Math.floor($('body').height()) - 380}px`);

          this.buildPreviewDialog();
          await this.retrieveInputFields();

          if (this.MODE !== 'N') {
            oViewModel.setProperty('/form/Hrdoc', oParameter.hrdoc);

            await this.retrieveDocument();

            const sTempHrdochtml = oViewModel.getProperty('/form/Hrdochtml');

            setTimeout(() => {
              $('.preview-box').html(sTempHrdochtml);
              this.setContentsBusy(false, 'editor');
            }, 100);
          } else {
            this.setContentsBusy(false, 'editor');
          }
        } catch (oError) {
          this.debug('Controller > documentTemplateMng Detail > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['page', 'button', 'input']);
        }
      },

      transformTreeData(aTreeData) {
        const aConvertedTreeData = _.map(aTreeData, (o) => {
          if (!_.isEmpty(o.Ipfldhtml)) {
            o.Ipfldhtml = _.replace(
              o.Ipfldhtml,
              /#style/g,
              'font-family:맑은 고딕;padding:0px 5px 1px;line-height:150%;font-weight:600;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.08);background-color:rgba(0, 113, 227, 0.16);border-radius:4px;display:inline-flex;justify-content:center;align-items:center;height:22px;color:#242a30;'
            );
          }

          return _.omit(o, ['Prcty', 'Actty', '__metadata']);
        });
        const aGroups = _.chain(aConvertedTreeData)
          .cloneDeep()
          .uniqBy('Ipctg')
          .map((el) =>
            _.chain(el)
              .omit(['Ipfld', 'Ipfldtx', 'Ipfldhtml', 'Ipfldcont'])
              .set('parent', true)
              .set('label', el.Ipctgtx)
              .set(
                'nodes',
                _.chain(aConvertedTreeData)
                  .filter({ Ipctg: el.Ipctg })
                  .map((e) => _.set(e, 'label', e.Ipfldtx))
                  .value()
              )
              .value()
          )
          .value();

        return aGroups;
      },

      validRequiredInputData() {
        const oViewModel = this.getViewModel();
        const mFieldValue = oViewModel.getProperty('/form');
        const aFieldProperties = [
          { field: 'Hrdoctx', label: 'LABEL_47001', type: Validator.INPUT2 }, // HR문서
          { field: 'Begda', label: 'LABEL_47009', type: Validator.INPUT1 }, // 사용기간
          { field: 'TempHrdochtml', label: 'LABEL_47007', type: Validator.INPUT1 }, // 문서양식
        ];

        if (!Validator.check({ mFieldValue, aFieldProperties })) return true;

        return false;
      },

      async retrieveInputFields() {
        const oViewModel = this.getViewModel();

        try {
          const sAuth = oViewModel.getProperty('/auth');

          const aTemplates = await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'InputField', {
            Actty: sAuth,
          });

          oViewModel.setProperty('/templates', this.transformTreeData(aTemplates));
          this.byId(this.INPUT_FIELDS_TREE_ID).expandToLevel(2);
        } catch (oError) {
          throw oError;
        }
      },

      setEditorHtml() {
        const oEditor = this.byId(this.EDITOR_ID);
        const oViewModel = this.getViewModel();
        const sHrdocHtml = oViewModel.getProperty('/form/Hrdochtml');

        if (!_.isEmpty(sHrdocHtml)) {
          const sTransformHtml = _.chain(sHrdocHtml)
            .replace(/(data-placeholder-type=")([^"]+)(.+)(@[^<]+)/g, (v1, v2, v3, v4, v5) => `${v2}${v5}${v4}${v3}`)
            .value();

          oEditor.insertContent(sTransformHtml);
          oEditor.scrollToTop();
          // oEditor.reinitializeTinyMCE4();

          this.setContentsBusy(false, 'editor');
        }
      },

      async buildPreviewDialog() {
        if (!this.oPreviewDialog) {
          this.oPreviewDialog = await Fragment.load({
            name: 'sap.ui.yesco.mvc.view.documentTemplateMng.fragment.Preview',
            controller: this,
          });
        }

        this.getView().addDependent(this.oPreviewDialog);
      },

      async retrieveDocument() {
        const oViewModel = this.getViewModel();

        try {
          const sHrdoc = oViewModel.getProperty('/form/Hrdoc');
          const sAuth = oViewModel.getProperty('/auth');

          const [mDetailData] = await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'HrDocument', {
            Actty: sAuth,
            Begda: moment().hours(9).toDate(),
            Hrdoc: sHrdoc,
          });

          if (this.MODE === 'C') mDetailData.Hrdoc = '';
          oViewModel.setProperty('/form', mDetailData);
        } catch (oError) {
          throw oError;
        }
      },

      async createProcess() {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.PA);
          const mFormData = _.cloneDeep(oViewModel.getProperty('/form'));

          await Client.create(oModel, 'HrDocument', {
            Actty: oViewModel.getProperty('/auth'),
            ..._.chain(mFormData).pick(['Hrdoc', 'Hrdoctx', 'Begda', 'Endda']).omitBy(_.isNil).value(),
            Hrdochtml: _.chain(mFormData.TempHrdochtml)
              .cloneDeep()
              .replace(/(data-placeholder-type=")([^"]+)(.+)(@[^<]+)/g, (v1, v2, v3, v4, v5) => `${v2}${v5}${v4}${v3}`)
              .value(),
          });

          // {저장}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', this.getBundleText('LABEL_00103')), {
            onClose: () => this.getRouter().navTo(this.PRE_ROUTE_NAME),
          });
        } catch (oError) {
          throw oError;
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onReadyEditor(oEvent) {
        const oEditor = oEvent.getSource();

        oEditor.addButtonGroup('styleselect').addButtonGroup('table').addButtonGroup('hr').addButtonGroup('code');

        setTimeout(() => this.setEditorHtml(), 1000);
      },

      onBeforeEditorInit(oEvent) {
        const oConfig = oEvent.getParameter('configuration');

        oConfig.browser_spellcheck = false;
        oConfig.content_style = 'body { font-family: 맑은 고딕; font-size: 12pt; }';
        oConfig.font_formats = '맑은 고딕=Malgun Gothic;';
        oConfig.plugins = 'table hr code';
      },

      onSelectTreeItem(oEvent) {
        const oEditor = this.byId(this.EDITOR_ID);
        const oSelectContext = oEvent.getParameter('listItem').getBindingContext();
        const mSelectedItem = oSelectContext.getProperty();
        const sIpfldhtml = mSelectedItem.Ipfldhtml;
        const sTemplateHtml =
          '<span data-placeholder-type="@TEMPLATE-CODE" style="font-family:맑은 고딕;padding:0px 5px 1px;line-height:150%;font-weight:600;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.08);background-color:rgba(0, 113, 227, 0.16);border-radius:4px;display:inline-flex;justify-content:center;align-items:center;height:22px;color:#242a30;">@TEMPLATE-TEXT</span><span class="empty-space">&nbsp;</span>';

        if (mSelectedItem.parent) return;

        if (_.isEmpty(sIpfldhtml)) {
          oEditor.insertContent(
            _.chain(sTemplateHtml)
              .replace(/TEMPLATE-CODE/g, mSelectedItem.Ipfld)
              .replace(/TEMPLATE-TEXT/g, mSelectedItem.Ipfldtx)
              .value()
          );
        } else {
          oEditor.insertContent(sIpfldhtml);
        }
      },

      createWatermarkSVG(sWatermarkText) {
        const xmlns = 'http://www.w3.org/2000/svg';
        let svgElem = document.createElementNS(xmlns, 'svg');

        svgElem.setAttributeNS(null, 'id', 'watermarkPrint');
        svgElem.setAttributeNS(null, 'width', '100%');
        svgElem.setAttributeNS(null, 'height', '100%');
        svgElem.style.position = 'absolute';
        svgElem.style.top = '0';
        svgElem.style.left = '0';

        let defs = document.createElementNS(xmlns, 'defs');
        let pattern = document.createElementNS(xmlns, 'pattern');

        pattern.setAttributeNS(null, 'id', 'textstripe');
        pattern.setAttributeNS(null, 'patternUnits', 'userSpaceOnUse');
        pattern.setAttributeNS(null, 'width', '620');
        pattern.setAttributeNS(null, 'height', '150');
        pattern.setAttributeNS(null, 'patternTransform', 'rotate(-45)');

        let text = document.createElementNS(xmlns, 'text');

        text.setAttributeNS(null, 'y', '60');
        text.setAttributeNS(null, 'font-size', '40');
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

      onPreview() {
        try {
          const oPdfDomElement = document.getElementById(this.byId('preview-box-container').getId());
          const sWatermarkText = `${moment().format('YYYY-MM-DD HH:mm:ss')}_성환희`;

          this.PdfUtils.download({ oPdfDomElement, sWatermarkText });
        } catch (error) {
          console.log(error);
        }
      },

      onSave() {
        if (this.validRequiredInputData()) return;

        this.setContentsBusy(true);

        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), MessageBox.Action.CANCEL],
          onClose: async (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              this.setContentsBusy(false);
              return;
            }

            try {
              this.setContentsBusy(true);

              await this.createProcess();
            } catch (oError) {
              this.debug('Controller > documentTemplateMng Detail > onPressApproval Error', oError);

              AppUtils.handleError(oError);
            } finally {
              this.setContentsBusy(false);
            }
          },
        });
      },

      onPressPdf() {
        html2canvas(document.getElementById('preview-box-container'), {
          onrendered: function (canvas) {
            // 캔버스를 이미지로 변환
            const imgData = canvas.toDataURL('image/png');

            const imgWidth = 210; // 이미지 가로 길이(mm) A4 기준
            const pageHeight = imgWidth * 1.414; // 출력 페이지 세로 길이 계산 A4 기준
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let doc = new jsPDF('p', 'mm', 'a4');
            let position = 0;

            // 첫 페이지 출력
            doc.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // 한 페이지 이상일 경우 루프 돌면서 출력
            while (heightLeft >= 20) {
              position = heightLeft - imgHeight;
              doc.addPage();
              doc.addImage(imgData, 'JPEG', 15, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }

            // 파일 저장
            doc.save('sample.pdf');

            //이미지로 표현
            // document.write('<img src="' + imgData + '" />');
          },
        });
      },
    });
  }
);
