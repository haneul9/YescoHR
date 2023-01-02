sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/m/ListMode',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    ListMode,
    MessageBox,
    Appno,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.medical.mobile.MedicalDetail', {
      DIALOG_FILE_ID: 'DialogAttFile',

      initializeModel() {
        return {
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          ReWriteBtn: false,
          ReWriteStat: false,
          ViewKey: '',
          sYear: '',
          previousName: '',
          FormData: {},
          DialogData: {},
          TargetDetails: {},
          RemoveFiles: [],
          HisList: [],
          HisListMode: ListMode.None,
          TargetList: [],
          ReceiptType: [],
          HisDeleteDatas: [],
          AttachTableVisible: this.getAppointeeProperty('Werks') !== '2000',
          Settings: {},
          DialogLimit: false,
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
          busy: true,
        };
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR09';
      },

      getPreviousRouteName() {
        return this.getViewModel().getProperty('/previousName');
      },

      getCurrentLocationText() {
        return this.getBundleText('LABEL_00195', 'LABEL_09001'); // {의료비} 신청
      },

      async onObjectMatched({ oDataKey }, sRouteName) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setData(this.initializeModel());
          oViewModel.setProperty('/ViewKey', oDataKey);

          // Input Field Imited
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'MedExpenseAppl')));
          oViewModel.setProperty('/FieldLimitPop', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'MedExpenseItem')));
          oViewModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());

          const aAppList = await this.getTargetList();

          oViewModel.setProperty('/TargetList', new ComboEntry({ codeKey: 'Kdsvh', valueKey: 'Znametx', aEntries: aAppList }));

          this.setFormData();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      // FormData Settings
      async setFormData() {
        const oViewModel = this.getViewModel();

        const sWerks = this.getAppointeeProperty('Werks');
        const sMsg = this.getGuideMessage(sWerks);
        oViewModel.setProperty('/InfoMessage', sMsg);

        const [{ Zyear }] = await this.getTotalYear();

        oViewModel.setProperty('/sYear', Zyear);

        const sViewKey = oViewModel.getProperty('/ViewKey');

        if (sViewKey === 'N' || !sViewKey) {
          const mAppointeeData = this.getAppointeeData();
          const sZero = this.getBracketCount(0); // (0건)
          const sRjbetRjcntHtml = this.getRjbetRjcntHtml(0, 0);

          oViewModel.setProperty('/HisListMode', ListMode.MultiSelect);

          oViewModel.setProperty('/FormData', {
            Pernr: mAppointeeData.Pernr,
            Kdsvh: 'ALL',
            Apcnt: '0',
            ApcntTxt: sZero,
            Pvcnt: '0',
            PvcntTxt: sZero,
            Rjcnt: '0',
            RjbetRjcntHtml: sRjbetRjcntHtml,
            Pyyea: Zyear,
            Znametx: oViewModel.getProperty('/TargetList/0/Znametx'),
          });

          const mSessionData = this.getSessionData();

          oViewModel.setProperty('/ApplyInfo', {
            Apename: mSessionData.Ename,
            Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
            Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          });
        } else {
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const mSendObject = {
            Pernr: this.getAppointeeProperty('Pernr'),
            Prcty: 'D',
            Appno: sViewKey,
            MedExpenseItemSet: [],
          };

          const oTargetData = await Client.create(oModel, 'MedExpenseAppl', mSendObject);
          const aHisList = oTargetData.MedExpenseItemSet.results;
          const sRjbetRjcntHtml = this.getRjbetRjcntHtml(oTargetData.Rjbet, oTargetData.Rjcnt);

          oViewModel.setProperty('/FormData', oTargetData);
          oViewModel.setProperty('/FormData/ApcntTxt', this.getBracketCount(Number(oTargetData.Apcnt)));
          oViewModel.setProperty('/FormData/PvcntTxt', this.getBracketCount(Number(oTargetData.Pvcnt)));
          oViewModel.setProperty('/FormData/RjbetRjcntHtml', sRjbetRjcntHtml);
          oViewModel.setProperty('/ApplyInfo', oTargetData);
          oViewModel.setProperty('/TargetDetails', oTargetData);
          oViewModel.setProperty('/HisList', aHisList);
          oViewModel.setProperty('/HisListMode', !oTargetData.Lnsta || oTargetData.Lnsta === '10' ? ListMode.MultiSelect : ListMode.None);
          oViewModel.setProperty(
            '/ReWriteBtn',
            _.some(aHisList, (e) => e.ZappStat === 'F')
          );

          const iHisLength = aHisList.length;
          oViewModel.setProperty('/listInfo', {
            rowCount: iHisLength > 10 ? 10 : iHisLength,
          });

          this.getReceiptList(oTargetData.Famgb, oTargetData.Adult);
        }

        this.settingsAttachTable();
      },

      getGuideMessage(sWerks) {
        const sCommMsg = `<p class="mb-0"><span style="padding:0 1px 0 2px; color:#006bd3">※</span> <span>${this.getBundleText('MSG_05017')}</span>
<span style="color:#006bd3; margin-left:-3px">${this.getBundleText('MSG_05018')} ${this.getBundleText('MSG_05019')}</span>
</p><p class="mt-0 ml-40-px">${this.getBundleText('MSG_05020')}</p>`;
        let sMsg = '';

        if (sWerks === '2000') {
          sMsg = `<p>${this.getBundleText('MSG_09002')}</p>
<p>${this.getBundleText('MSG_09003')}</p>
<p>${this.getBundleText('MSG_09004')}</p>
<p>${this.getBundleText('MSG_09005')}</p>
<ul>
  <li>${this.getBundleText('MSG_09006')}
    <ul>
      <li>${this.getBundleText('MSG_09007')}</li>
      <li>${this.getBundleText('MSG_09008')}</li>
      <li>${this.getBundleText('MSG_09009')}</li>
      <li>${this.getBundleText('MSG_09010')}</li>
      <li>${this.getBundleText('MSG_09011')}</li>
      <li>${this.getBundleText('MSG_09012')}</li>
      <li>${this.getBundleText('MSG_09013')}</li>
      <li>${this.getBundleText('MSG_09014')}</li>
    </ul>
  </li>
</ul>
<p>${this.getBundleText('MSG_09015')}</p>
<br />
${sCommMsg}`;
        } else if (sWerks === '1000' || sWerks === '4000' || sWerks === '5000') {
          sMsg = `<ol>
  <li>${this.getBundleText('MSG_09029')}</il>
  <li>${this.getBundleText('MSG_09030')}</il>
  <ul>
    <li>${this.getBundleText('MSG_09031')}</li>
    <li>${this.getBundleText('MSG_09032')}</li>
  </ul>
  <li>${this.getBundleText('MSG_09033')}</il>
  <li>${this.getBundleText('MSG_09034')}</il>
  <li>${this.getBundleText('MSG_09035')}</il>
  <ul>
    <li>${this.getBundleText('MSG_09036')}</li>
    <li>${this.getBundleText('MSG_09037')}</li>
    <li>${this.getBundleText('MSG_09038')}</li>
  </ul>
  <li>${this.getBundleText('MSG_09039')}</il>
  <ul>
    <li>${this.getBundleText('MSG_09040')}</li>
    ${this.getBundleText('MSG_09041')}
    <li>${this.getBundleText('MSG_09042')}</li>
    <li>${this.getBundleText('MSG_09043')}</li>
    <li>${this.getBundleText('MSG_09044')}</li>
    <li>${this.getBundleText('MSG_09045')}</li>
    <li>${this.getBundleText('MSG_09046')}</li>
    <li>${this.getBundleText('MSG_09047')}</li>
  </ul>
</ol>
${sCommMsg}`;
        } else if (sWerks === '3000') {
          sMsg = `<dl>
  <dt>${this.getBundleText('MSG_09002')}</dt>
  <dd>${this.getBundleText('MSG_09048')}</dd>
  <dt>${this.getBundleText('MSG_09004')}</dt>
  <br />
  <dt>${this.getBundleText('MSG_09005')}</dt>
  <dt>${this.getBundleText('LABEL_09025')}</dt>
  <dd>${this.getBundleText('MSG_09049')}</dd>
  <dd>${this.getBundleText('MSG_09050')}</dd>
  <dd>${this.getBundleText('MSG_09051')}</dd>
  <dd>${this.getBundleText('MSG_09052')}</dd>
  <dt>${this.getBundleText('LABEL_09026')}</dt>
  <dd>${this.getBundleText('MSG_09053')}</dd>
  <dd>${this.getBundleText('MSG_09054')}</dd>
  <dd>${this.getBundleText('MSG_09055')}</dd>
  <dd>${this.getBundleText('MSG_09056')}</dd>
  <dd>${this.getBundleText('MSG_09057')}</dd>
  <dd>${this.getBundleText('MSG_09058')}</dd>
  <dd>${this.getBundleText('MSG_09059')}</dd>
</dl>`;
        }
        return sMsg;
      },

      // 신청 첨부파일 AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/FormData/Lnsta');
        const sAppno = oViewModel.getProperty('/FormData/Appno') || '';

        this.AttachFileAction.setAttachFile(this, {
          Appno: sAppno,
          Type: this.getApprovalType(),
          Max: 10,
          Editable: !sStatus || sStatus === '10',
        });
      },

      async onPressOpenGuideDialog() {
        if (!this.oGuideDialog) {
          const oView = this.getView();

          this.oGuideDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.medical.mobile.fragment.GuideDialog',
            controller: this,
          });

          oView.addDependent(this.oGuideDialog);
        }

        this.oGuideDialog.open();
      },

      onPressCloseGuideDialog() {
        if (this.oGuideDialog) {
          this.oGuideDialog.close();
        }
      },

      getRjbetRjcntHtml(iRjbet, iRjcnt) {
        return `<div class="sapMText multi-line" style="white-space:normal">
  <span class="color-10">${this.TextUtils.toCurrency(iRjbet)}</span>&nbsp;(<span class="color-10">${Number(iRjcnt)}</span>${this.getBundleText('LABEL_09101')})
</div>`; // 건
      },

      async getTotalYear() {
        const oModel = this.getModel(ServiceNames.BENEFIT);

        return Client.getEntitySet(oModel, 'MedExpenseMymed', { Pernr: this.getAppointeeProperty('Pernr') });
      },

      async getReceiptList(sKey, sAdult) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const sViewKey = oViewModel.getProperty('/ViewKey');
        const Werks = this.getSessionProperty('Werks');
        const Pernr = this.getAppointeeProperty('Pernr');
        let mPayLoad;

        if (sViewKey && sViewKey !== 'N') {
          const { Adult, Famgb, Pyyea, Appno } = oViewModel.getProperty('/FormData');

          mPayLoad = {
            Adult,
            Famgb,
            Werks,
            Pyyea,
            Appno,
            Pernr,
          };
          sKey = Famgb;
        } else {
          const [{ Zyear }] = await Client.getEntitySet(oModel, 'MedExpenseMymed');

          mPayLoad = {
            Adult: sAdult,
            Famgb: sKey,
            Werks,
            Pyyea: Zyear,
            Appno: '',
            Pernr,
          };
        }

        const aReceiptList = await Client.getEntitySet(oModel, 'MedExpenseReceiptList', mPayLoad);

        // 영수증구분
        oViewModel.setProperty('/ReceiptType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aReceiptList }));
      },

      async getTargetList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const mPayLoad = {
          Datum: new Date(),
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return Client.getEntitySet(oModel, 'MedExpenseSupportList', mPayLoad);
      },

      // 신청대상 선택시
      async onTargetList(oEvent) {
        this.setBusy();

        const oViewModel = this.getViewModel();
        const oEventSource = oEvent.getSource();
        const oContext = oEvent.getParameter('changedItem').getBindingContext();
        // const oContext = oEvent.getSource().getSelectedItem().getBindingContext();
        const sTargetPath = oContext.getPath();
        const mSelectedDetail = oContext.getProperty();

        // 2022-10-18 입력된 진료내역이 존재할 때 신청대상 변경 시 입력 건 임시저장 여부 확인
        if (oViewModel.getProperty('/HisList').length !== 0) {
          MessageBox.confirm(this.getBundleText('MSG_09063'), {
            // 대상자 변경 시 기입력한 데이터가 삭제됩니다. 임시저장하시겠습니까?
            title: this.getBundleText('LABEL_09010'), // 저장
            actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')], // 저장, 취소
            onClose: async (fVal) => {
              // 저장 시 기입력내용 임시저장 + 신청대상 변경 및 신청내역, 진료내역 초기화
              if (fVal && fVal === this.getBundleText('LABEL_00103')) {
                try {
                  const mFormData = oViewModel.getProperty('/FormData');

                  if (!mFormData.Appno) {
                    const sAppno = await Appno.get.call(this);

                    _.chain(mFormData).set('Appno', sAppno).set('Appda', new Date()).commit();
                  }

                  // FileUpload
                  if (this.AttachFileAction.getFileCount.call(this)) {
                    await this.AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
                  }

                  const aRemovalFiles = oViewModel.getProperty('/RemoveFiles');
                  if (aRemovalFiles.length) {
                    await aRemovalFiles.forEach((mFile) => {
                      this.AttachFileAction.deleteFile(mFile.Appno2, this.getApprovalType());
                    });
                  }

                  const oModel = this.getModel(ServiceNames.BENEFIT);
                  const mSendObject = {
                    ...mFormData,
                    Prcty: 'T',
                    Menid: oViewModel.getProperty('/menid'),
                    Waers: 'KRW',
                    MedExpenseItemSet: oViewModel.getProperty('/HisList'),
                  };

                  await Client.create(oModel, 'MedExpenseAppl', mSendObject);

                  const sZero = this.getBracketCount(0); // (0건)
                  const sRjbetRjcntHtml = this.getRjbetRjcntHtml(0, 0);

                  // 신청내역 초기화
                  oViewModel.setProperty('/FormData/Appno', '');
                  oViewModel.setProperty('/FormData/Appda', null);
                  oViewModel.setProperty('/FormData/Apbet', '0');
                  oViewModel.setProperty('/FormData/Apcnt', '0');
                  oViewModel.setProperty('/FormData/ApcntTxt', sZero);
                  oViewModel.setProperty('/FormData/Zbigo', '');
                  oViewModel.setProperty('/FormData/Pvbet', '0');
                  oViewModel.setProperty('/FormData/Pvcnt', '0');
                  oViewModel.setProperty('/FormData/PvcntTxt', sZero);
                  oViewModel.setProperty('/FormData/PybetTot', '0');
                  oViewModel.setProperty('/FormData/Paymm', '');
                  oViewModel.setProperty('/FormData/Rjbet', '0');
                  oViewModel.setProperty('/FormData/Rjcnt', '0');
                  oViewModel.setProperty('/FormData/RjbetRjcntHtml', sRjbetRjcntHtml);
                  oViewModel.setProperty('/FormData/ZappResn', '');

                  this.onClearDoc(sTargetPath, mSelectedDetail);
                } catch (oError) {
                  AppUtils.handleError(oError);
                }
              } else {
                const mDetail = oViewModel.getProperty('/TargetDetails');

                oViewModel.setProperty('/FormData/Adult', mDetail.Adult);
                oViewModel.setProperty('/FormData/Zname', mDetail.Zname);
                oViewModel.setProperty('/FormData/Znametx', mDetail.Znametx);
                oViewModel.setProperty('/FormData/Famsa', mDetail.Famsa);
                oViewModel.setProperty('/FormData/Objps', mDetail.Objps);
                oViewModel.setProperty('/FormData/Kdsvh', mDetail.Kdsvh);
                oViewModel.setProperty('/FormData/Famgb', mDetail.Famgb);
                oViewModel.setProperty('/FormData/Pratetx', mDetail.Pratetx);
                oViewModel.setProperty('/FormData/Prate', mDetail.Prate);
              }

              this.setBusy(false);
            },
          });
        } else {
          this.onClearDoc(sTargetPath, mSelectedDetail);
          this.setBusy(false);
        }
        oEventSource.close();
      },

      onClearDoc(sTargetPath, mSelectedDetail) {
        if (!sTargetPath || !mSelectedDetail) {
          return;
        }

        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/TargetDetails', mSelectedDetail);
        oViewModel.setProperty('/FormData/Adult', mSelectedDetail.Adult);
        oViewModel.setProperty('/FormData/Zname', mSelectedDetail.Zname);
        oViewModel.setProperty('/FormData/Znametx', mSelectedDetail.Znametx);
        oViewModel.setProperty('/FormData/Famsa', mSelectedDetail.Famsa);
        oViewModel.setProperty('/FormData/Objps', mSelectedDetail.Objps);
        oViewModel.setProperty('/FormData/Kdsvh', mSelectedDetail.Kdsvh);
        oViewModel.setProperty('/FormData/Famgb', mSelectedDetail.Famgb);
        oViewModel.setProperty('/FormData/Pratetx', mSelectedDetail.Pratetx);
        oViewModel.setProperty('/FormData/Prate', mSelectedDetail.Prate);

        if (sTargetPath.substr(-1) === '0') {
          return;
        }

        oViewModel.setProperty('/HisList', []);
        oViewModel.setProperty('/listInfo/rowCount', 0);
        this.getReceiptList(mSelectedDetail.Famgb, mSelectedDetail.Adult);
      },

      checkError(sMode = 'R') {
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');

        // 신청대상
        if (mFormData.Kdsvh === 'ALL' || !mFormData.Kdsvh) {
          MessageBox.alert(this.getBundleText('MSG_09025')); // 신청대상을 선택하세요.
          return true;
        }

        // 2022-11-29 신청이 아니면 신청대상 외 입력 체크 제외
        if (sMode !== 'R') {
          return false;
        }

        // 2022-10-18 비고 필수입력 제외
        // 비고
        // if (!mFormData.Zbigo) {
        //   MessageBox.alert(this.getBundleText('MSG_09026')); // 비고를 입력하세요.
        //   return true;
        // }

        // 상세내역
        const aHisList = oViewModel.getProperty('/HisList');
        if (!aHisList.length) {
          MessageBox.alert(this.getBundleText('MSG_09027')); // 상세내역을 추가하세요.
          return true;
        }

        // 첨부파일
        const bResult = aHisList.every((e) => e.Attyn === 'X'); // 진료내역별 증빙파일 첨부 체크
        if (this.getAppointeeProperty('Werks') === '2000') {
          // 예스코의 경우 신청 첨부파일은 받지 않고 진료내역별 증빙파일만 받음
          if (!bResult) {
            MessageBox.alert(this.getBundleText('MSG_09064')); // 진료내역 중 증빙파일이 누락된 건이 있습니다.
            return true;
          }
        } else {
          if (!bResult && !this.AttachFileAction.getFileCount.call(this)) {
            MessageBox.alert(this.getBundleText('MSG_09028')); // 신청 첨부파일을 등록하거나 진료내역별 증빙파일을 모두 등록하세요.
            return true;
          }
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        const oViewModel = this.getViewModel();
        const sZero = this.getBracketCount(0); // (0건)
        const sRjbetRjcntHtml = this.getRjbetRjcntHtml(0, 0);

        oViewModel.setProperty('/FormData/Appno', '');
        oViewModel.setProperty('/FormData/Lnsta', '');
        oViewModel.setProperty('/FormData/Pvbet', '0');
        oViewModel.setProperty('/FormData/Pvcnt', '0');
        oViewModel.setProperty('/FormData/PvcntTxt', sZero);
        oViewModel.setProperty('/FormData/Paymm', '');
        oViewModel.setProperty('/FormData/Rjbet', '0');
        oViewModel.setProperty('/FormData/Rjcnt', '0');
        oViewModel.setProperty('/FormData/RjbetRjcntHtml', sRjbetRjcntHtml);
        oViewModel.setProperty('/FormData/ZappResn', '');
        oViewModel.setProperty('/ReWriteBtn', false);
        oViewModel.setProperty('/ReWriteStat', true);

        const aHisList = _.chain(oViewModel.getProperty('/HisList'))
          .filter((e) => {
            return e.ZappStat === 'F';
          })
          .each((e) => {
            e.ZappStat = '';
          })
          .value();

        oViewModel.setProperty('/HisList', aHisList);
        oViewModel.setProperty('/HisListMode', ListMode.MultiSelect);
        oViewModel.setProperty('/listInfo/rowCount', _.size(aHisList));
        this.setAppAmount();
        this.addSeqnrNum();
        this.settingsAttachTable();
      },

      // 신청액 & 신청건수
      setAppAmount() {
        const oViewModel = this.getViewModel();
        const aAmount = oViewModel.getProperty('/HisList').map((a) => a.Bettot);
        const iSumAmount = aAmount.reduce((iAcc, iAmount) => {
          return Number(iAcc) + Number(iAmount);
        }, 0);

        oViewModel.setProperty('/FormData/Apbet', String(iSumAmount));
        oViewModel.setProperty('/FormData/Apcnt', aAmount.length);
        oViewModel.setProperty('/FormData/ApcntTxt', this.getBracketCount(aAmount.length)); // ({0}건)
      },

      // 임시저장
      onSaveBtn() {
        if (this.checkError('S')) return;

        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          title: this.getBundleText('LABEL_09010'), // 의료비신청
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')], // 저장, 취소
          onClose: async (vPress) => {
            // 저장
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oViewModel = this.getViewModel();
              const mFormData = oViewModel.getProperty('/FormData');

              if (!mFormData.Appno) {
                const sAppno = await Appno.get.call(this);

                _.chain(mFormData).set('Appno', sAppno).set('Appda', new Date()).commit();
              }

              // FileUpload
              if (!!this.AttachFileAction.getFileCount.call(this)) {
                await this.AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
              }

              const aDeleteDatas = oViewModel.getProperty('/RemoveFiles');

              if (!!aDeleteDatas.length) {
                await aDeleteDatas.forEach((e) => {
                  this.AttachFileAction.deleteFile(e.Appno2, this.getApprovalType());
                });
              }

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const mSendObject = {
                ...mFormData,
                Prcty: 'T',
                Menid: oViewModel.getProperty('/menid'),
                Waers: 'KRW',
                MedExpenseItemSet: oViewModel.getProperty('/HisList'),
              };

              await Client.create(oModel, 'MedExpenseAppl', mSendObject);

              // {저장}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));

              if (!oViewModel.getProperty('/FormData/Lnsta')) {
                oViewModel.setProperty('/FormData/Lnsta', '10');
                oViewModel.setProperty('/FormData/Lnstatx', this.getBundleText('LABEL_00104')); // 임시저장
              }
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        AppUtils.setAppBusy(true);

        if (this.checkError('R')) {
          AppUtils.setAppBusy(false);
          return;
        }

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          // 신청, 취소
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 신청
            if (!vPress || vPress !== this.getBundleText('LABEL_00121')) {
              AppUtils.setAppBusy(false);
              return;
            }

            try {
              const oViewModel = this.getViewModel();
              const mFormData = oViewModel.getProperty('/FormData');

              if (!mFormData.Appno) {
                const sAppno = await Appno.get.call(this);

                _.chain(mFormData).set('Appno', sAppno).set('Appda', new Date()).commit();
              }

              // FileUpload
              if (!!this.AttachFileAction.getFileCount.call(this)) {
                await this.AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
              }

              const aDeleteDatas = oViewModel.getProperty('/RemoveFiles');
              if (aDeleteDatas.length) {
                await aDeleteDatas.forEach((e) => {
                  this.AttachFileAction.deleteFile(e.Appno2, this.getApprovalType());
                });
              }

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const mSendObject = {
                ...mFormData,
                Prcty: 'C',
                Menid: oViewModel.getProperty('/menid'),
                Waers: 'KRW',
                MedExpenseItemSet: oViewModel.getProperty('/HisList'),
              };

              await Client.create(oModel, 'MedExpenseAppl', mSendObject);

              // {신청}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // 취소
      onCancelBtn() {
        // {취소}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          // 확인, 취소
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 취소
            if (!vPress || vPress !== this.getBundleText('LABEL_00114')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true);

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const oViewModel = this.getViewModel();
              const mSendObject = {
                ...oViewModel.getProperty('/FormData'),
                Prcty: 'W',
                Menid: oViewModel.getProperty('/menid'),
              };

              delete mSendObject.isNew;

              await Client.create(oModel, 'MedExpenseAppl', mSendObject);

              // {취소}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError, {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } finally {
              AppUtils.setAppBusy(false);
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

            try {
              AppUtils.setAppBusy(true);

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const oViewModel = this.getViewModel();

              await Client.remove(oModel, 'MedExpenseAppl', { Appno: oViewModel.getProperty('/FormData/Appno') });

              // {삭제}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // Excel Copy to Dialog
      async excelCopy() {
        const sCopiedText = await window.navigator.clipboard.readText();
        const aTextList = sCopiedText.split('\t');
        const oDetailController = AppUtils.getAppComponent().byId('mobile_medicalDetail');
        const oViewModel = oDetailController.getModel();

        aTextList.forEach((e, i) => {
          switch (i) {
            // 진료기간 paste
            case 0:
              const oDateRange = oDetailController.byId(`DialogData${i + 1}`);
              const aDate = e.trim().replace(/\D/g, '').match(/\d{8}/g);
              const dDate = moment(aDate[0], 'YYYYMMDD').toDate();
              const dSecendDate = moment(aDate[1], 'YYYYMMDD').toDate();
              const iBaseYear = parseInt(oViewModel.getProperty('/sYear'));
              const iDateYear = dDate.getFullYear();
              const iSecDateYear = dSecendDate.getFullYear();

              // 유효한 날짜체크
              if (iBaseYear !== iDateYear || iBaseYear !== iSecDateYear) {
                MessageBox.alert(oDetailController.getController().getBundleText('MSG_09060', iBaseYear));
                oDateRange.setDateValue(new Date());
                oDateRange.setSecondDateValue(new Date());
                return;
              }

              oDateRange.setDateValue(dDate);
              oDateRange.setSecondDateValue(dSecendDate);

              break;
            // 급여
            case 1:
              const oInput1 = oDetailController.byId(`DialogData${i + 1}`);
              const sCost1 = e.trim().replace(/[^\d]/g, '');

              oInput1.setValue(new Intl.NumberFormat('ko-KR').format(sCost1 || 0));
              oViewModel.setProperty('/DialogData/Bet01', sCost1);

              // oInput1.setValue(new Intl.NumberFormat('ko-KR').format(sCost1 || ''));
              // oViewModel.setProperty('/DialogData/Bet01', sCost1 == '' ? 0 : sCost1);
              break;
            // 병명/진료과목
            case 2:
              const oInput2 = oDetailController.byId(`DialogData${i + 1}`);

              oInput2.setValue(e);
              break;
            // 비급여
            case 3:
              const oInput3 = oDetailController.byId(`DialogData${i + 1}`);
              const sCost2 = e.trim().replace(/[^\d]/g, '');

              oInput3.setValue(new Intl.NumberFormat('ko-KR').format(sCost2 || 0));
              // oInput3.setValue(new Intl.NumberFormat('ko-KR').format(sCost2 || ''));

              oViewModel.setProperty('/DialogData/Bet02', sCost2);
              oViewModel.setProperty('/DialogData/Bettot', String(parseInt(sCost2) + parseInt(oViewModel.getProperty('/DialogData/Bet01'))));
              break;
            // 의료기관
            case 4:
              const oInput4 = oDetailController.byId(`DialogData${i + 1}`);

              oInput4.setValue(e);
              break;
            // 영수증구분
            case 5:
              const oInput5 = oDetailController.byId(`DialogData${i + 1}`);
              const sText = e.slice(0, e.search(`\r\n`));
              let bSucces = true;

              oViewModel.getProperty('/ReceiptType').forEach((ele) => {
                if (ele.Ztext === sText) {
                  oInput5.setValue(ele.Ztext);
                  oViewModel.setProperty('/DialogData/Recpgb', ele.Zcode);
                  bSucces = false;
                }
              });

              if (bSucces) {
                // 영수증 구분을 확인하세요.
                MessageBox.alert(oDetailController.getController().getBundleText('MSG_09016'));
                oViewModel.setProperty('/DialogData/Recpgb', 'ALL');
                return;
              }

              break;
          }
        });
      },

      // 상세내역 추가
      async onAddDetails() {
        const oViewModel = this.getViewModel();
        const sAppTarget = oViewModel.getProperty('/FormData/Kdsvh');

        if (!sAppTarget || sAppTarget === 'ALL') {
          return MessageBox.alert(this.getBundleText('MSG_09023')); // 신청대상을 입력하세요.
        }

        oViewModel.setProperty('/DialogData', {});

        this.setDialogData();

        if (!this.oDetailHisDialog) {
          const oView = this.getView();

          this.oDetailHisDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.medical.mobile.fragment.DetailHisDialog',
            controller: this,
          });

          this.byId('DialogData1').attachBrowserEvent('paste', this.excelCopy);
          this.byId('DialogData2').attachBrowserEvent('paste', this.excelCopy);
          this.byId('DialogData3').attachBrowserEvent('paste', this.excelCopy);
          this.byId('DialogData4').attachBrowserEvent('paste', this.excelCopy);
          this.byId('DialogData5').attachBrowserEvent('paste', this.excelCopy);
          this.byId('DialogData6').attachBrowserEvent('paste', this.excelCopy);

          oView.addDependent(this.oDetailHisDialog);
        }

        this.settingsAttachDialog();

        this.oDetailHisDialog.open();
      },

      // Dialog SettingData
      async setDialogData(mRowData) {
        const oViewModel = this.getViewModel();

        if (!mRowData) {
          oViewModel.setProperty('/DialogData', {
            Recpgb: 'ALL',
            Pratetx: oViewModel.getProperty('/FormData/Pratetx'),
            Prate: oViewModel.getProperty('/FormData/Prate'),
            isNew: true,
          });

          oViewModel.setProperty('/ReWriteStat', true);
        } else {
          const sLnsta = oViewModel.getProperty('/FormData/Lnsta');
          const bRewrit = !mRowData.ZappStat && (!sLnsta || sLnsta === '10');

          oViewModel.setProperty('/ReWriteStat', bRewrit);
          oViewModel.setProperty('/DialogData', _.cloneDeep(mRowData));
          oViewModel.setProperty('/DialogData/isNew', false);
        }

        const dBegda = oViewModel.getProperty('/DialogData/Begda');
        const iYear = dBegda ? moment(dBegda).year() : parseInt(oViewModel.getProperty('/sYear'));

        oViewModel.setProperty('/DialogData/minDate', new Date(iYear, 0, 1));
        oViewModel.setProperty('/DialogData/maxDate', new Date());
      },

      // 진료내역 Dialog AttachFileTable Settings
      settingsAttachDialog() {
        const oViewModel = this.getViewModel();
        const sAppno = oViewModel.getProperty('/DialogData/Appno2') || '';

        this.AttachFileAction.setAttachFile(this, {
          Id: this.DIALOG_FILE_ID,
          Title: this.getBundleText('LABEL_09104'), // 증빙파일
          Appno: sAppno,
          Type: this.getApprovalType(),
          Max: 1,
          Editable: oViewModel.getProperty('/ReWriteStat'),
        });
      },

      // 상세내역 삭제
      onDelDetails() {
        const aSelectedItems = this.byId('medHisTable').getSelectedItems();
        if (!aSelectedItems.length) {
          return MessageBox.alert(this.getBundleText('MSG_00020', 'LABEL_00110')); // {삭제}할 행을 선택하세요.
        }

        const oViewModel = this.getViewModel();
        const aHisDeleteDatas = aSelectedItems.map((e) => e.getBindingContext().getProperty());
        oViewModel.setProperty('/RemoveFiles', aHisDeleteDatas);

        const aHisList = oViewModel.getProperty('/HisList');
        const aNoInclued = aHisList.filter((e) => !aHisDeleteDatas.includes(e));
        oViewModel.setProperty('/HisList', aNoInclued);

        this.setAppAmount();
        this.addSeqnrNum();
      },

      // 상세내역 No
      addSeqnrNum() {
        const oViewModel = this.getViewModel();
        const aHisList = oViewModel.getProperty('/HisList');

        aHisList.forEach((e, i) => {
          e.Seqnr = String(i + 1);
        });

        oViewModel.refresh();
      },

      /*
       *******************************************************************************************
       *****************************DialogEvent***************************************************
       */

      // 진료내역 check
      checkClinicDetail() {
        const oViewModel = this.getViewModel();
        const mDialogData = oViewModel.getProperty('/DialogData');

        // 진료기간
        if (!mDialogData.Begda) {
          MessageBox.alert(this.getBundleText('MSG_09018'));
          return true;
        }

        // 병명/진료과목
        if (!mDialogData.Disenm) {
          MessageBox.alert(this.getBundleText('MSG_09019'));
          return true;
        }

        // 의료기관명
        if (!mDialogData.Medorg) {
          MessageBox.alert(this.getBundleText('MSG_09020'));
          return true;
        }

        // 영수증 구분
        if (!mDialogData.Recpgb || mDialogData.Recpgb === 'ALL') {
          MessageBox.alert(this.getBundleText('MSG_09021'));
          return true;
        }

        // 금여 or 비급여
        if (!mDialogData.Bet01 && !mDialogData.Bet02) {
          MessageBox.alert(this.getBundleText('MSG_09022'));
          return true;
        }

        // 금여 or 비급여 한도체크
        if (oViewModel.getProperty('/DialogLimit')) {
          MessageBox.alert(this.getBundleText('MSG_09024'));
          return true;
        }

        const mReciptDetails = oViewModel.getProperty('/ReciptDetails');
        const mTargetDetails = oViewModel.getProperty('/TargetDetails');

        if (!!mReciptDetails) {
          // 급여인경우
          if (!!mDialogData.Bet01) {
            const iBet01 = parseInt(mReciptDetails.Bet01);
            const iActCost = parseInt(mDialogData.Bet01) * parseFloat(mTargetDetails.Prate);

            if (iBet01 < iActCost) {
              MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet01Basic, this.TextUtils.toCurrency(parseInt(iBet01 / parseFloat(mTargetDetails.Prate)))));
              return true;
            }
          }

          if (!!mDialogData.Bet02) {
            const iBet02 = parseInt(mReciptDetails.Bet02);
            const sAddBet02 = mReciptDetails.Bet02Add;
            const iActCost = parseInt(mDialogData.Bet02) * parseFloat(mTargetDetails.Prate);

            if ((sAddBet02 === '0' || !sAddBet02) && !mReciptDetails.Bet02AddChk) {
              if (iBet02 < iActCost) {
                // 비급여 한도를 초과했을경우
                MessageBox.alert(this.getBundleText('MSG_09062', mReciptDetails.Bet02Basic, this.TextUtils.toCurrency(parseInt(iBet02 / parseFloat(mTargetDetails.Prate)))));
                return true;
              }
            } else {
              // 2022-07-22 금액 체크로직 삭제
              // const iAddBet02 = parseInt(sAddBet02);
              // if (iAddBet02 < iActCost) {
              //   // 비급여 추가한도를 초과했을경우
              //   MessageBox.alert(this.getBundleText('MSG_09061', mReciptDetails.Bet02AddBasic, this.TextUtils.toCurrency(parseInt(iAddBet02 / parseFloat(mTargetDetails.Prate)))));
              //   return true;
              // }
            }
          }
        }

        // 2022-11-29 예스코(2000)의 경우 진료내역 dialog에서 첨부파일 체크 로직은 제거하고 신청시에 체크하도록 변경
        // 인사영역 2000번일경우는 첨부파일 필수
        // if (this.getAppointeeProperty('Werks') === '2000' && !this.getViewModel(this.DIALOG_FILE_ID).getProperty('/Data').length) {
        //   MessageBox.alert(this.getBundleText('MSG_00046')); // 첨부파일을 등록하세요.
        //   return true;
        // }

        return false;
      },

      checkedDialogData(aDetailList = []) {
        aDetailList.forEach((e) => {
          e.Waers = 'KRW';
        });

        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const mSendObject = {
          ...oViewModel.getProperty('/FormData'),
          Prcty: '1',
          MedExpenseItemSet: aDetailList,
        };

        return Client.create(oModel, 'MedExpenseAppl', mSendObject);
      },

      // Dialog 등록
      async onHisRegBtn() {
        this.setBusy();

        if (this.checkClinicDetail()) {
          this.setBusy(false);
          return;
        }

        const oViewModel = this.getViewModel();

        try {
          const mDialogData = oViewModel.getProperty('/DialogData');

          if (!mDialogData.Appno2 || _.parseInt(mDialogData.Appno2) === 0) {
            const sAppno = await Appno.get.call(this);

            _.set(mDialogData, 'Appno2', sAppno);
          }

          const aHisList = [_.set(mDialogData, 'Waers', 'KRW'), ...oViewModel.getProperty('/HisList')];
          const aDetail = [];

          aHisList.forEach((e) => {
            if (e.Appno2 === mDialogData.Appno2) {
              e.Line = 'X';
            } else {
              e.Line = '';
            }
            aDetail.push(e);
          });

          // 2022-07-22 비급여 한도금액(추가) 메세지 처리 로직 추가 - Errmsg 필드에 메세지가 리턴된 경우 비급여 필드(Bet02) 데이터 변경 + 합계 재계산
          const aData = await this.checkedDialogData(aHisList);
          const aMedItem = _.find(aData.MedExpenseItemSet.results, { Line: 'X' });
          if (!_.isEmpty(aMedItem.Errmsg)) {
            MessageBox.alert(aMedItem.Errmsg);

            oViewModel.setProperty('/DialogData/Bet02', aMedItem.Bet02);

            const iBet01 = mDialogData.Bet01 ? parseInt(mDialogData.Bet01.trim().replace(/[^\d]/g, '')) : 0;
            const iBet02 = mDialogData.Bet02 ? parseInt(mDialogData.Bet02.trim().replace(/[^\d]/g, '')) : 0;

            oViewModel.setProperty('/DialogData/Bettot', String(iBet01 + iBet02));
            oViewModel.setProperty('/DialogData/Appno2', '');
            oViewModel.setProperty('/DialogData/isNew', true);

            return;
          }

          // const oTable = this.byId('medHisTable');

          oViewModel.setProperty('/HisList', aDetail);
          // oViewModel.setProperty('/listInfo', this.TableUtils.count({ oTable, aRowData: aHisList, sStatCode: 'ZappStat' }));

          this.setAppAmount();
          this.addSeqnrNum();

          await this.AttachFileAction.uploadFile.call(this, mDialogData.Appno2, this.getApprovalType(), this.DIALOG_FILE_ID);

          const oDialogModel = this.getViewModel(this.DIALOG_FILE_ID);
          let sFile = '';

          if (oDialogModel.getProperty('/DeleteDatas').length) {
            sFile = '';
          }

          if (oDialogModel.getProperty('/Data').length) {
            sFile = 'X';
          }

          oViewModel.setProperty('/DialogData/Attyn', sFile);
          this.onDialogClose();
        } catch (oError) {
          oViewModel.setProperty('/DialogData/isNew', true);
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      // Dialog 수정
      async onHisUpBtn() {
        this.setBusy();

        if (this.checkClinicDetail()) {
          this.setBusy(false);
          return;
        }

        try {
          const oViewModel = this.getViewModel();
          const mDialogData = oViewModel.getProperty('/DialogData');

          if (!mDialogData.Appno2 || (!mDialogData.Appno2 && !mDialogData.ZappStat) || _.parseInt(mDialogData.Appno2) === 0) {
            const sAppno = await Appno.get.call(this);

            _.set(mDialogData, 'Appno2', sAppno);
          }

          const aDetail = [];
          const aHisList = oViewModel.getProperty('/HisList');

          aHisList.forEach((e) => {
            if (e.Appno2 === mDialogData.Appno2) {
              e = mDialogData;
              e.Line = 'X';
            } else {
              e.Line = '';
            }
            aDetail.push(e);
          });

          // 2022-07-22 비급여 한도금액(추가) 메세지 처리 로직 추가 - Errmsg 필드에 메세지가 리턴된 경우 비급여 필드(Bet02) 데이터 변경 + 합계 재계산
          // await this.checkedDialogData(aDetail);
          const aData = await this.checkedDialogData(aDetail);
          const aMedItem = _.find(aData.MedExpenseItemSet.results, { Line: 'X' });
          if (!_.isEmpty(aMedItem.Errmsg)) {
            MessageBox.alert(aMedItem.Errmsg);

            oViewModel.setProperty('/DialogData/Bet02', aMedItem.Bet02);

            const iBet01 = mDialogData.Bet01 ? parseInt(mDialogData.Bet01.trim().replace(/[^\d]/g, '')) : 0;
            const iBet02 = mDialogData.Bet02 ? parseInt(mDialogData.Bet02.trim().replace(/[^\d]/g, '')) : 0;

            oViewModel.setProperty('/DialogData/Bettot', String(iBet01 + iBet02));

            return;
          }

          await this.AttachFileAction.uploadFile.call(this, mDialogData.Appno2, this.getApprovalType(), this.DIALOG_FILE_ID);

          oViewModel.setProperty('/HisList', aDetail);

          const oDialogModel = this.getViewModel(this.DIALOG_FILE_ID);

          let sFile = '';

          if (oDialogModel.getProperty('/DeleteDatas').length) {
            sFile = '';
          }

          if (oDialogModel.getProperty('/Data').length) {
            sFile = 'X';
          }

          oViewModel.setProperty('/DialogData/Attyn', sFile);
          this.setAppAmount();
          this.onDialogClose();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      // Dialog Close
      onDialogClose() {
        this.oDetailHisDialog.close();
      },

      // 급여 , 비급여 한도 비교
      liveCompar(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBinding('value').getPath();
        const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');
        const oViewModel = this.getViewModel();
        const mReciptDetails = oViewModel.getProperty('/ReciptDetails');
        const mTargetDetails = oViewModel.getProperty('/TargetDetails');
        const iValue = parseInt(sValue);
        const iActCost = iValue * parseFloat(mTargetDetails.Prate);
        let sAmount = sValue;

        oViewModel.setProperty('/DialogLimit', false);

        if (!!mReciptDetails) {
          // 급여인경우
          if (sPath === '/DialogData/Bet01') {
            const iBet01 = parseInt(mReciptDetails.Bet01);

            if (iBet01 < iActCost) {
              MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet01Basic, this.TextUtils.toCurrency(parseInt(iBet01 / parseFloat(mTargetDetails.Prate)))));
              oViewModel.setProperty('/DialogLimit', true);
            }
          } else {
            const iBet02 = parseInt(mReciptDetails.Bet02);
            const sAddBet02 = mReciptDetails.Bet02Add;

            if ((sAddBet02 === '0' || !sAddBet02) && !mReciptDetails.Bet02AddChk) {
              if (iBet02 < iActCost) {
                // 비급여를 초과했을경우
                MessageBox.alert(this.getBundleText('MSG_09062', mReciptDetails.Bet02Basic, this.TextUtils.toCurrency(parseInt(iBet02 / parseFloat(mTargetDetails.Prate)))));
                oViewModel.setProperty('/DialogLimit', true);
              }
            } else {
              // 2022-07-22 금액 체크 로직 삭제
              // const iAddBet02 = parseInt(sAddBet02);
              // if (iAddBet02 < iActCost) {
              //   // 비급여 추가한도를 초과했을경우
              //   MessageBox.alert(this.getBundleText('MSG_09061', mReciptDetails.Bet02AddBasic, this.TextUtils.toCurrency(parseInt(iAddBet02 / parseFloat(mTargetDetails.Prate)))));
              //   oViewModel.setProperty('/DialogLimit', true);
              // }
            }
          }
        }

        oEventSource.setValue(this.TextUtils.toCurrency(sAmount));
        oViewModel.setProperty(sPath, !sAmount ? '0' : sAmount);

        setTimeout(() => {
          const mDialogData = oViewModel.getProperty('/DialogData');
          const iBet01 = parseInt(mDialogData.Bet01) || 0;
          const iBet02 = parseInt(mDialogData.Bet02) || 0;

          oViewModel.setProperty('/DialogData/Bettot', String(iBet01 + iBet02));
        }, 100);
      },

      // 상세내역 Click
      async onDetailsRow(oEvent) {
        const oRowData = oEvent.getSource().getBindingContext().getProperty();

        this.setDialogData(oRowData);

        if (!this.oDetailHisDialog) {
          const oView = this.getView();

          this.oDetailHisDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.medical.mobile.fragment.DetailHisDialog',
            controller: this,
          });

          // connect dialog to the root view of this component (models, lifecycle)
          oView.addDependent(this.oDetailHisDialog);

          this.byId('DialogData1').attachBrowserEvent('paste', this.excelCopy);
          this.byId('DialogData2').attachBrowserEvent('paste', this.excelCopy);
          this.byId('DialogData3').attachBrowserEvent('paste', this.excelCopy);
          this.byId('DialogData4').attachBrowserEvent('paste', this.excelCopy);
          this.byId('DialogData5').attachBrowserEvent('paste', this.excelCopy);
          this.byId('DialogData6').attachBrowserEvent('paste', this.excelCopy);
        }

        this.settingsAttachDialog();

        this.oDetailHisDialog.open();
      },

      // 영수증 구분선택시 데이터 셋팅
      onRecipt(oEvent) {
        const sKey = oEvent.getSource().getSelectedKey();
        const oViewModel = this.getViewModel();

        oViewModel.getProperty('/ReceiptType').forEach((e) => {
          if (sKey === e.Zcode) {
            oViewModel.setProperty('/ReciptDetails', e);
            oViewModel.setProperty('/DialogData/Recpgbtx', e.Ztext);
          }
        });
      },

      formatDate(sDate = '') {
        return !sDate || _.toNumber(sDate) === 0 ? '' : `${sDate.slice(0, 4)}.${sDate.slice(4, 6)}`;
      },

      forMatCost(cost1 = '0', cost2 = '0', costtot = '0') {
        const sMob1 = this.TextUtils.toCurrency(cost1);
        const sMob2 = this.TextUtils.toCurrency(cost2);
        const sMobtot = this.TextUtils.toCurrency(costtot);

        return `${sMobtot} (${sMob1} / ${sMob2})`;
      },

      /**
       * @return ({vCount}건)
       */
      getBracketCount(vCount) {
        return this.getBundleText('LABEL_09103', vCount); // ({vCount}건)
      },

      setBusy(bBusy = true) {
        setTimeout(() => {
          this.getViewModel().setProperty('/busy', bBusy);
        });
      },

      reduceViewResource() {
        if (this.oGuideDialog) {
          this.oGuideDialog.destroy();
          this.oGuideDialog = null;
        }
        if (this.oDetailHisDialog) {
          this.oDetailHisDialog.destroy();
          this.oDetailHisDialog = null;
        }
      },
    });
  }
);
