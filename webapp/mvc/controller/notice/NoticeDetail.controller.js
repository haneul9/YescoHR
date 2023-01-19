/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지주석
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/richtexteditor/RichTextEditor',
  ],
  (
    // prettier 방지용 주석
    Appno,
    AppUtils,
    ServiceNames,
    Client,
    MessageBox,
    BaseController,
    RTE
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.notice.NoticeDetail', {
      LIST_PAGE_ID: {
        E: 'container-ehr---notice',
        H: 'container-ehr---h_notice',
      },

      initializeModel() {
        return {
          MenId: '',
          MySelf: false,
          Hass: this.isHass(),
          FormData: {},
          FieldLimit: {},
          Settings: {},
          busy: false,
        };
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.Sdate === 'N' ? this.getBundleText('LABEL_00167') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // override AttachFileCode
      getApprovalType() {
        return '10';
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          const sSdate = new Date(parseInt(oParameter.Sdate)) || oParameter.Sdate;
          const sSeqnr = oParameter.Seqnr;
          const sMenid = this.getCurrentMenuId();

          oViewModel.setProperty('/Menid', sMenid);
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.COMMON, 'NoticeManage')));

          if (!sSeqnr || sSeqnr === 'N') {
            const oSessionData = this.getSessionData();

            oViewModel.setProperty('/MySelf', true);
            oViewModel.setProperty('/FormData', {
              ApernTxt: `${oSessionData.Orgtx} ${oSessionData.Ename}`,
              Apern: oSessionData.Pernr,
            });
          } else {
            const sWerks = this.getSessionProperty('Werks');
            let mSendObject = {
              Prcty: '1',
              Sdate: sSdate,
              Seqnr: sSeqnr,
              Werks: sWerks,
              Notice1Nav: [],
              Notice2Nav: [],
            };

            const oModel = this.getModel(ServiceNames.COMMON);
            const oDetail = await Client.deep(oModel, 'NoticeManage', mSendObject);

            const oTargetData = oDetail.Notice1Nav.results[0];

            if (this.getSessionProperty('Pernr') === oTargetData.Apern) {
              oViewModel.setProperty('/MySelf', true);
            }

            oTargetData.Detail = _.map(oDetail.Notice2Nav.results, (m) => m.Detail).join('');

            oViewModel.setProperty('/FormData', oTargetData);
            $('#readHtml').empty().append(oTargetData.Detail);
          }

          // setTimeout(() => {
          //   this.setTextEditor();
          // }, 100);

          this.settingsAttachTable();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 중요항목 & 임시저장 Check
      onSelected(oEvent) {
        const bSelected = oEvent.getSource().getSelected();
        const sPath = oEvent.getSource().getBinding('selected').getBindings()[0].getPath();

        if (bSelected) {
          this.getViewModel().setProperty(sPath, 'X');
        } else {
          this.getViewModel().setProperty(sPath, '');
        }
      },

      checkError() {
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');

        // 제목
        if (!mFormData.Title) {
          MessageBox.alert(this.getBundleText('MSG_08001'));
          return true;
        }

        // 내용
        if (!mFormData.Detail) {
          MessageBox.alert(this.getBundleText('MSG_08002'));
          return true;
        }

        return false;
      },

      // 임시저장
      onSaveBtn() {
        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true);

                const oViewModel = this.getViewModel();
                const sAppno = oViewModel.getProperty('/FormData/Appno');

                if (!sAppno) {
                  const vAppno = await Appno.get.call(this);

                  oViewModel.setProperty('/FormData/Appno', vAppno);
                  oViewModel.setProperty('/FormData/Sdate', new Date());
                }

                const aDetail = [];
                const mFormData = oViewModel.getProperty('/FormData');
                const aList = mFormData.Detail.match(new RegExp('.{1,' + 4000 + '}', 'g'));

                aList.forEach((e) => {
                  const mDetailObj = {};

                  mDetailObj.Detail = e;
                  aDetail.push(mDetailObj);
                });

                mFormData.Detail = '';
                mFormData.Hide = 'X';

                // FileUpload
                await this.AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());

                const oModel = this.getModel(ServiceNames.COMMON);
                const sWerks = this.getSessionProperty('Werks');

                await Client.deep(oModel, 'NoticeManage', {
                  Prcty: '2',
                  Werks: sWerks,
                  Notice1Nav: [mFormData],
                  Notice2Nav: aDetail,
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'), {
                  onClose: () => {
                    this.onNavBack();
                  },
                });
              } catch (oError) {
                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false);
              }
            }
          },
        });
      },

      // 등록
      onRegistBtn() {
        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00106'), {
          actions: [this.getBundleText('LABEL_00106'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00106')) {
              try {
                AppUtils.setAppBusy(true);
                const oViewModel = this.getViewModel();
                const sAppno = oViewModel.getProperty('/FormData/Appno');

                if (!sAppno) {
                  const vAppno = await Appno.get.call(this);

                  oViewModel.setProperty('/FormData/Appno', vAppno);
                  oViewModel.setProperty('/FormData/Sdate', new Date());
                }

                const aDetail = [];
                const mFormData = oViewModel.getProperty('/FormData');
                const aList = mFormData.Detail.match(new RegExp('.{1,' + 4000 + '}', 'g'));

                aList.forEach((e) => {
                  const mDetailObj = {};

                  mDetailObj.Detail = e;
                  aDetail.push(mDetailObj);
                });

                mFormData.Detail = '';
                mFormData.Hide = '';

                const sWerks = this.getSessionProperty('Werks');

                // FileUpload
                await this.AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());

                const oModel = this.getModel(ServiceNames.COMMON);
                let mSendObject = {
                  Prcty: '2',
                  Werks: sWerks,
                  Notice1Nav: [mFormData],
                  Notice2Nav: aDetail,
                };

                await Client.deep(oModel, 'NoticeManage', mSendObject);

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00106'), {
                  onClose: () => {
                    this.onNavBack();
                  },
                });
              } catch (error) {
                AppUtils.handleError(error);
              } finally {
                AppUtils.setAppBusy(false);
              }
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        // {삭제}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          // 삭제, 취소
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 삭제
            if (!vPress || vPress !== this.getBundleText('LABEL_00110')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const mFormData = this.getViewModel().getProperty('/FormData');
              const aList = mFormData.Detail.match(new RegExp('.{1,' + 4000 + '}', 'g'));
              const aDetail = [];

              aList.forEach((e) => {
                const mDetailObj = {};

                mDetailObj.Detail = e;
                aDetail.push(mDetailObj);
              });

              mFormData.Detail = '';

              const oModel = this.getModel(ServiceNames.COMMON);
              const mSendObject = {
                Prcty: '3',
                Werks: this.getSessionProperty('Werks'),
                Notice1Nav: [mFormData],
                Notice2Nav: aDetail,
              };

              await Client.deep(oModel, 'NoticeManage', mSendObject);

              // {삭제}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (error) {
              AppUtils.handleError(error);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      editorReady(oEvent) {
        oEvent.getSource().addButtonGroup('styleselect').addButtonGroup('table');
      },

      setTextEditor() {
        if (!!this.byId('EditorBox').getItems()[0]) {
          this.byId('EditorBox').destroyItems();
        }

        const oViewModel = this.getViewModel();
        const bStat = !!oViewModel.getProperty('/MySelf') && !!oViewModel.getProperty('/Hass');
        const oRichTextEditor = new RTE('myRTE', {
          editorType: sap.ui.richtexteditor.EditorType.TinyMCE4, // 'TinyMCE4',
          layoutData: new sap.m.FlexItemData({ growFactor: 1 }),
          width: '99.8%',
          height: '500px',
          customToolbar: bStat,
          showGroupFont: bStat,
          showGroupInsert: bStat,
          showGroupTextAlign: bStat,
          showGroupStructure: bStat,
          showGroupFontStyle: bStat,
          showGroupClipboard: bStat,
          value: oViewModel.getProperty('/FormData/Detail'),
          editable: bStat,
          ready: function () {
            this.addButtonGroup('styleselect').addButtonGroup('table');
          },
        });

        this.byId('EditorBox').addItem(oRichTextEditor);
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const bHass = oViewModel.getProperty('/Hass');
        const bMySelf = oViewModel.getProperty('/MySelf');
        const sAppno = oViewModel.getProperty('/FormData/Appno') || '';

        this.AttachFileAction.setAttachFile(this, {
          Editable: !!bHass && !!bMySelf,
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
        });
      },
    });
  }
);
