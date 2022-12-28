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

    return BaseController.extend('sap.ui.yesco.mvc.controller.documentTemplateMng.Detail', {
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
              'font-family:맑은 고딕;font-size:10pt;padding:0px 5px 1px;line-height:150%;font-weight:600;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.08);background-color:rgba(0, 113, 227, 0.16);border-radius:4px;display:inline-flex;justify-content:center;align-items:center;height:22px;color:#242a30;'
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
          oEditor.insertContent(sHrdocHtml);
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
            Hrdochtml: _.cloneDeep(mFormData.TempHrdochtml),
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

        oEditor.addButtonGroup('styleselect').addButtonGroup('table').addButtonGroup('hr');

        setTimeout(() => this.setEditorHtml(), 1000);
      },

      onBeforeEditorInit(oEvent) {
        const oConfig = oEvent.getParameter('configuration');

        oConfig.browser_spellcheck = false;
        oConfig.content_style =
          'body { font-family: 맑은 고딕; font-size: 10pt; line-height: 16pt; } p { margin: 10px 0; } td span { font-size: 10pt; } html ::-webkit-scrollbar {width:5px !important; background:transparent !important; scrollbar-gutter:stable both-edges} html ::-webkit-scrollbar-thumb {border-radius:2.5px !important; background-color:#c1c3c8 !important} html textarea::-webkit-scrollbar {height:5px !important}';
        oConfig.font_formats = '맑은 고딕=Malgun Gothic;';
        oConfig.plugins = 'table,hr,tabfocus';
        // oConfig.plugins = 'lists,directionality,tabfocus,table,lists,textpattern,hr,code';
      },

      onSelectTreeItem(oEvent) {
        const oEditor = this.byId(this.EDITOR_ID);
        const oSelectContext = oEvent.getParameter('listItem').getBindingContext();
        const mSelectedItem = oSelectContext.getProperty();
        const sIpfldhtml = mSelectedItem.Ipfldhtml;
        const sTemplateHtml =
          '<span data-placeholder-type="@TEMPLATE-CODE" style="font-family:맑은 고딕;padding:0px 5px 1px;line-height:150%;font-weight:600;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.08);background-color:rgba(0, 113, 227, 0.16);border-radius:4px;display:inline-flex;justify-content:center;align-items:center;height:22px;color:#242a30;">@TEMPLATE-TEXT</span><span class="empty-space">&nbsp;</span>';

        oEvent.getSource().removeSelections();

        if (mSelectedItem.parent) return;

        if (_.isEmpty(sIpfldhtml)) {
          if (mSelectedItem.Ipfld === '9020') {
            oEditor.insertContent(
              `<p class="page2break">${_.chain(sTemplateHtml)
                .replace(/TEMPLATE-CODE/g, 'pagebreak')
                .replace(/TEMPLATE-TEXT/g, mSelectedItem.Ipfldtx)
                .value()}</p>`
            );
          } else {
            oEditor.insertContent(
              _.chain(sTemplateHtml)
                .replace(/TEMPLATE-CODE/g, mSelectedItem.Ipfld)
                .replace(/TEMPLATE-TEXT/g, mSelectedItem.Ipfldtx)
                .value()
            );
          }
        } else {
          oEditor.insertContent(sIpfldhtml);
        }
      },

      onPreview() {
        const oViewModel = this.getViewModel();
        const sTempHrdochtml = oViewModel.getProperty('/form/TempHrdochtml');

        if (_.isEmpty(sTempHrdochtml)) return;

        this.oPreviewDialog.open();
        setTimeout(() => $('.preview-box').html(sTempHrdochtml), 100);
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
    });
  }
);
