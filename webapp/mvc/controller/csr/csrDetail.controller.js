sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/common/FileAttachmentBoxHandler',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    Appno,
    AppUtils,
    Client,
    ServiceNames,
    BaseController,
    FileAttachmentBoxHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.csr.csrDetail', {
      PostcodeDialogHandler: null,
      ROUTE_MAP: {
        csrMng: 'H',
        csrAppr: 'M',
        csrAppl: 'E',
      },

      initializeModel() {
        return {
          busy: false,
          routeName: '',
          menid: this.getCurrentMenuId(),
          auth: 'E',
          Appno: '',
          Werks: '',
          Data: { Apcnt: '', Testc1: '', Testc2: '' },
          ApprovalData: [],
          ApprovalInfo: { rowCount: 0 },
          isNew: false,
          ButtonGroups: [
            {
              name: 'font-style',
              visible: true,
              row: 0,
              priority: 10,
              customToolbarPriority: 20,
              buttons: ['bold', 'italic', 'underline', 'strikethrough'],
            },
            {
              name: 'text-align',
              visible: true,
              row: 0,
              priority: 20,
              customToolbarPriority: 30,
              buttons: ['justifyleft', 'justifycenter', 'justifyright', 'justifyfull'],
            },
            {
              name: 'font',
              visible: true,
              row: 0,
              priority: 30,
              customToolbarPriority: 50,
              buttons: ['fontselect', 'fontsizeselect', 'forecolor', 'backcolor'],
            },
            {
              name: 'clipboard',
              visible: true,
              row: 0,
              priority: 10,
              customToolbarPriority: 110,
              buttons: ['cut', 'copy', 'paste'],
            },
            {
              name: 'structure',
              visible: true,
              row: 0,
              priority: 20,
              customToolbarPriority: 60,
              buttons: ['bullist', 'numlist', 'outdent', 'indent'],
            },
            {
              name: 'e-mail',
              visible: false,
              row: 0,
              priority: 30,
              customToolbarPriority: 10,
              buttons: [],
            },
            {
              name: 'undo',
              visible: true,
              row: 0,
              priority: 40,
              customToolbarPriority: 100,
              buttons: ['undo', 'redo'],
            },
            {
              name: 'insert',
              visible: true,
              row: 0,
              priority: 50,
              customToolbarPriority: 80,
              buttons: ['image', 'emoticons'],
            },
            {
              name: 'link',
              visible: true,
              row: 0,
              priority: 60,
              customToolbarPriority: 70,
              buttons: ['link', 'unlink'],
            },
            {
              name: 'styleselect',
              buttons: ['styleselect'],
              customToolbarPriority: 40,
              visible: true,
              priority: 10,
              row: 0,
            },
            {
              name: 'table',
              buttons: ['table'],
              customToolbarPriority: 90,
              visible: true,
              priority: 10,
              row: 0,
            },
          ],
        };
      },

      // override AttachFileCode
      getApprovalType() {
        return 'CSR0';
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());
        oDetailModel.setProperty('/busy', true);

        try {
          const sDataKey = oParameter.oDataKey;
          const sWerks = oParameter.werks;
          const sPreviousRouteName = sRouteName.match(/.+(?=\-detail)/);

          oDetailModel.setProperty('/Appno', sDataKey);
          oDetailModel.setProperty('/Werks', sWerks);
          oDetailModel.setProperty('/auth', this.ROUTE_MAP[sPreviousRouteName] || 'E');
          oDetailModel.setProperty('/routeName', sPreviousRouteName);

          await this.setFormData();
          this.settingsAttachTable();

          setTimeout(() => this.setEditor(), 1000);
        } catch (oError) {
          oDetailModel.setProperty('/busy', false);
          this.debug(`Controller > ${sRouteName} Detail > onObjectMatched Error`, oError);

          AppUtils.handleError(oError);
        }
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // 이전화면
      onPreBack() {
        const oViewModel = this.getViewModel();
        let sRouteName = oViewModel.getProperty('/routeName');

        this.getRouter().navTo(sRouteName);
      },

      editorReady() {
        // oEvent.getSource().addButtonGroup('styleselect').addButtonGroup('table');
      },

      // FormData Settings
      async setFormData() {
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/Appno');
        const sWerks = oDetailModel.getProperty('/Werks');

        if (sAppno === 'N' || !sAppno) {
          oDetailModel.setProperty('/Data', { Prstg: '10', Prsta: '', Apcnt: '', Testc1: '', Testc2: '', Clsda: moment().hours(9).toDate() });
          oDetailModel.setProperty('/ApprovalData', []);
          oDetailModel.setProperty('/ApprovalInfo/rowCount', 1);
          oDetailModel.setProperty('/isNew', true);
        } else {
          oDetailModel.setProperty('/isNew', false);
          const oModel = this.getModel(ServiceNames.COMMON);
          const [mData] = await Client.getEntitySet(oModel, 'CsrRequest', {
            Appno: sAppno,
            Werks: sWerks,
          });

          mData.Prgno = mData.Prgno.replace('\\n', '\n');
          mData.Ctsno = mData.Ctsno.replace('\\n', '\n');
          mData.Testc1 = _.replace(mData.Testc1, /&NBSP;/g, '&nbsp;');
          mData.Testc2 = _.replace(mData.Testc2, /&NBSP;/g, '&nbsp;');

          const mData2 = await Client.getEntitySet(oModel, 'CsrRequestApproval', {
            Appno: sAppno,
            Werks: sWerks,
          });

          var sEdit = '',
            mApprovalData = []; //
          for (var i = 0; i < mData2.length; i++) {
            var tmp = $.extend(true, {}, mData2[i]);
            tmp.Idx = i + 1;

            if (sEdit === '' && !tmp.Datum && tmp.Uzeittx === '000000') {
              sEdit = 'X';
              tmp.Edit = true;
            } else {
              tmp.Edit = false;
            }

            mApprovalData.push(tmp);
          }

          oDetailModel.setProperty('/Data', mData);
          oDetailModel.setProperty('/ApprovalData', mApprovalData);
          oDetailModel.setProperty('/ApprovalInfo/rowCount', mApprovalData.length);
        }
      },

      setEditor() {
        const oViewModel = this.getViewModel();

        try {
          const oEditor1 = this.byId('csrEditor1');
          const oEditor2 = this.byId('csrEditor2');
          const oEditor3 = this.byId('csrEditor3');
          const sAuth = oViewModel.getProperty('/auth');
          const sPrsta = oViewModel.getProperty('/Data/Prsta');
          const sApcnt = oViewModel.getProperty('/Data/Apcnt');
          const sTestc1 = oViewModel.getProperty('/Data/Testc1');
          const sTestc2 = oViewModel.getProperty('/Data/Testc2');

          if (oEditor2 && sTestc1) oEditor2._oEditor.execCommand('mceInsertContent', false, sTestc1);
          if (oEditor3 && sTestc2) oEditor3._oEditor.execCommand('mceInsertContent', false, sTestc2);
          if (oEditor1 && sApcnt) oEditor1._oEditor.execCommand('mceInsertContent', false, sApcnt);

          if (sAuth !== 'H') {
            oEditor2.setEditable(false);

            if (sAuth === 'E' && sPrsta === '21') {
              oEditor3.setEditable(true);
            } else {
              oEditor3.setEditable(false);
            }
          } else {
            oEditor2.setEditable(true);
            oEditor3.setEditable(true);
          }
        } catch (oError) {
          this.debug(`Controller > csr Detail > setEditor Error`, oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 유형 변경 시 결재현황 리스트 조회 후 세팅
      async onsetApprovalList() {
        const oDetailModel = this.getViewModel();

        if (!oDetailModel.getProperty('/Data/Csrty')) {
          oDetailModel.setProperty('/ApprovalData', []);
          oDetailModel.setProperty('/ApprovalInfo/rowCount', 1);

          return;
        }

        const oModel = this.getModel(ServiceNames.COMMON);
        const mData = await Client.getEntitySet(oModel, 'CsrRequestApproval', {
          Prcty: 'A',
          Csrty: oDetailModel.getProperty('/Data/Csrty'),
        });

        const mApprovalData = _.map(mData, (o, i) => ({
          Idx: ++i,
          ...o,
          Edit: false,
        }));

        if (oDetailModel.getProperty('/isNew')) {
          _.set(mApprovalData[0], 'Edit', true);
        }

        oDetailModel.setProperty('/ApprovalData', mApprovalData);
        oDetailModel.setProperty('/ApprovalInfo/rowCount', mApprovalData.length);
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const mFormData = oDetailModel.getProperty('/Data');

        if (!mFormData.Apttl) {
          MessageBox.alert(this.getBundleText('MSG_46001')); // 제목을 입력하여 주십시오.
          return true;
        } else if (!mFormData.Csrty) {
          MessageBox.alert(this.getBundleText('MSG_46002')); // 유형을 선택하여 주십시오.
          return true;
        } else if (!mFormData.Clsda) {
          MessageBox.alert(this.getBundleText('MSG_46003')); // 완료희망일을 입력하여 주십시오.
          return true;
        } else if (!mFormData.ApcntHtml) {
          MessageBox.alert(this.getBundleText('MSG_46004')); // 내용을 입력하여 주십시오.
          return true;
        }

        return false;
      },

      onChangeWorkTime(oEvent) {
        const oViewModel = this.getViewModel();
        const oControl = oEvent.getSource();
        const sPath = oControl.getBinding('value').getPath();
        const mFormData = oViewModel.getProperty('/Data');

        oViewModel.setProperty(sPath, String(Number(oControl.getValue())));
        oViewModel.setProperty('/Data/Wrktm', _.chain(mFormData).pick(['Abaptm', 'Webtm']).values().sumBy(_.toNumber).toString().value());
      },

      onPressAccept() {
        this.onPressApprove('B');
      },

      onPressReject() {
        this.onPressApprove('C');
      },

      onPressComplete(oEvent) {
        const oViewModel = this.getViewModel();
        const sPrsta = oEvent.getSource().data('Prsta');
        const mMessageMap = {
          20: { begin: 'LABEL_46017', end: 'LABEL_46017' }, // 접수, 접수
          21: { begin: 'LABEL_46041', end: 'LABEL_46011' }, // 개발테스트완료, 개발테스트
          22: { begin: 'LABEL_46042', end: 'LABEL_46012' }, // 인수테스트완료, 인수테스트
          31: { begin: 'LABEL_46043', end: 'LABEL_46014' }, // CTS이관완료, CTS이관
          32: { begin: 'LABEL_00117', end: 'LABEL_46024' }, // 완료, CTS
        };
        const mProcessMsg = _.get(mMessageMap, sPrsta);

        oViewModel.setProperty('/busy', true);

        // {0} 처리하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_46006', _.get(mProcessMsg, 'begin')), {
          onClose: async (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) {
              oViewModel.setProperty('/busy', false);
              return;
            }

            try {
              const oModel = this.getModel(ServiceNames.COMMON);
              const mFormData = oViewModel.getProperty('/Data');

              // 첨부파일
              await this.oFileAttachmentBoxHandler.upload(mFormData.Appno);

              await Client.create(oModel, 'CsrRequest', {
                ...mFormData,
                Apcnt: mFormData.ApcntHtml,
                Testc1: mFormData.Testc1Html,
                Testc2: mFormData.Testc2Html,
              });
              await Client.create(oModel, 'CsrRequestApproval', {
                ..._.chain(mFormData).pick(['Werks', 'Appno']).omitBy(_.isNil).value(),
                Prcty: 'B',
                Prsta: sPrsta,
                Austy: oViewModel.getProperty('/auth'),
                Pernr: this.getAppointeeProperty('Pernr'),
                Comnt: _.chain(oViewModel.getProperty('/ApprovalData')).find({ Edit: true }).get('Comnt').value(),
              });

              // {0} 처리가 완료되었습니다.
              MessageBox.success(this.getBundleText('MSG_46007', _.get(mProcessMsg, 'end')), {
                onClose: () => {
                  oViewModel.setProperty('/busy', false);
                  this.getRouter().navTo(oViewModel.getProperty('/routeName'));
                },
              });
            } catch (oError) {
              const sRouteName = oViewModel.getProperty('/routeName');

              oViewModel.setProperty('/busy', false);
              this.debug(`Controller > ${sRouteName} Detail > onPressComplete Error`, oError);

              AppUtils.handleError(oError);
            }
          },
        });
      },

      // 신청
      onPressSave() {
        if (this.checkError()) return;
        const oDetailModel = this.getViewModel();

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          onClose: async (vPress) => {
            if (vPress && vPress === 'OK') {
              try {
                AppUtils.setAppBusy(true);

                const mFormData = oDetailModel.getProperty('/Data');

                const sAppno = mFormData.Appno;

                if (!sAppno) {
                  const sAppno = await Appno.get();

                  oDetailModel.setProperty('/Data/Appno', sAppno);
                  oDetailModel.setProperty('/Data/Appdt', new Date());
                  oDetailModel.setProperty('/Data/Prsta', '10');
                  oDetailModel.setProperty('/Data/Prstg', '10');
                } else if (oDetailModel.getProperty('/isNew') === true) {
                  oDetailModel.setProperty('/Data/Prsta', '10');
                  oDetailModel.setProperty('/Data/Prstg', '10');
                }

                // 첨부파일
                await this.oFileAttachmentBoxHandler.upload(mFormData.Appno);

                const mApprovalData = _.chain(oDetailModel.getProperty('/ApprovalData'))
                  .cloneDeep()
                  .map((o) => {
                    delete o.Idx;
                    delete o.__metadata;

                    return this.TimeUtils.convert2400Time(o);
                  })
                  .value();

                const oModel = this.getModel(ServiceNames.COMMON);
                const oSendObject = {
                  ...mFormData,
                  Apcnt: mFormData.ApcntHtml,
                  Testc1: mFormData.Testc1Html,
                  Testc2: mFormData.Testc2Html,
                  CsrRequest1Nav: mApprovalData,
                };

                await Client.create(oModel, 'CsrRequest', oSendObject);

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                  // {신청}되었습니다.
                  onClose: () => {
                    this.getRouter().navTo(oDetailModel.getProperty('/routeName'));
                  },
                });
              } catch (oError) {
                const sRouteName = oDetailModel.getProperty('/routeName');

                this.debug(`Controller > ${sRouteName} Detail > onPressSave Error`, oError);

                AppUtils.handleError(oError);

                if (oDetailModel.getProperty('/isNew') === true) {
                  oDetailModel.setProperty('/Data/Prsta', '');
                  oDetailModel.setProperty('/Data/Prstg', '10');
                }
              } finally {
                AppUtils.setAppBusy(false);
              }
            }
          },
        });
      },

      // PRCTY: B 승인, C 반려
      onPressApprove(vPrcty) {
        if (!vPrcty) return;

        const oDetailModel = this.getViewModel();
        const aText = { B: 'LABEL_00123', C: 'LABEL_00124' };

        // {승인|반려}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', aText[vPrcty]), {
          onClose: async (vPress) => {
            if (vPress && vPress === 'OK') {
              try {
                AppUtils.setAppBusy(true);

                const mFormData = oDetailModel.getProperty('/Data');
                const mApprovalData = _.find(oDetailModel.getProperty('/ApprovalData'), (o) => {
                  return o.Edit;
                });

                const oModel = this.getModel(ServiceNames.COMMON);
                const oSendObject = {
                  Prcty: vPrcty,
                  Appno: mFormData.Appno,
                  Werks: mFormData.Werks,
                  Comnt: mApprovalData.Comnt,
                };

                // 승인시 진행상태 값
                if (vPrcty === 'B') {
                  const iPrsta = _.toInteger(mFormData.Prsta);

                  switch (true) {
                    case iPrsta === 10:
                      oSendObject.Prsta = '11';
                      break;
                    case iPrsta === 11:
                      oSendObject.Prsta = '12';
                      break;
                    case iPrsta >= 22:
                      oSendObject.Prsta = '30';
                      break;
                    default:
                      delete oSendObject.Prsta;
                      break;
                  }
                }

                await Client.create(oModel, 'CsrRequestApproval', oSendObject);

                MessageBox.alert(this.getBundleText('MSG_00007', aText[vPrcty]), {
                  // {승인|반려}되었습니다.
                  onClose: () => {
                    this.getRouter().navTo(oDetailModel.getProperty('/routeName'));
                  },
                });
              } catch (oError) {
                const sRouteName = oDetailModel.getProperty('/routeName');

                this.debug(`Controller > ${sRouteName} Detail > onPressApprove Error`, oError);

                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false);
              }
            }
          },
        });
      },

      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/Data/Prsta');
        const sAppno = oViewModel.getProperty('/Data/Appno') || '';

        this.oFileAttachmentBoxHandler = new FileAttachmentBoxHandler(this, {
          visible: true,
          editable: sStatus === '' || oViewModel.getProperty('/auth') === 'H',
          appno: sAppno,
          apptp: this.getApprovalType(),
          maxFileCount: 10,
          fileTypes: ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'txt', 'bmp', 'gif', 'png', 'pdf'],
        });
      },

      formatUzeittx(fVal) {
        if (!fVal) return '';

        return fVal === '000000' ? '' : fVal.replace(/(\d{2})(?=\d)/g, '$1:');
      },
    });
  }
);
