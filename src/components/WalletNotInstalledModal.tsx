export default function WalletNotInstalledModal() {
  return (
    <>
      <div className="border-grey-500 border-2 flex flex-col justify-between fixed left-[50%] top-[50%] text-3xl text-center font-bold translate-x-[-50%] translate-y-[-50%] min-w-[90%] md:min-w-[40%] w-auto h-[40%] shadow-lg rounded-md bg-white px-5 py-5">
        <h2>Freighter Wallet Not Installed</h2>
        <div className=" flex justify-center items-center">
          <svg
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.78362 8.78412C8.49073 9.07702 8.49073 9.55189 8.78362 9.84478L10.9388 12L8.78362 14.1552C8.49073 14.4481 8.49073 14.923 8.78362 15.2159C9.07652 15.5088 9.55139 15.5088 9.84428 15.2159L11.9995 13.0607L14.1546 15.2158C14.4475 15.5087 14.9224 15.5087 15.2153 15.2158C15.5082 14.9229 15.5082 14.448 15.2153 14.1551L13.0602 12L15.2153 9.84485C15.5082 9.55196 15.5082 9.07708 15.2153 8.78419C14.9224 8.4913 14.4475 8.4913 14.1546 8.78419L11.9995 10.9393L9.84428 8.78412C9.55139 8.49123 9.07652 8.49123 8.78362 8.78412Z"
              fill="#ff0000"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12Z"
              fill="#ff0000"
            />
          </svg>
        </div>
        <div className="flex gap-7 justify-center items-center">
          <a
            href="https://chromewebstore.google.com/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View the project source code on GitHub"
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/30 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-900/60"
          >
            Download Extention !
          </a>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.location.reload();
            }}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View the project source code on GitHub"
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/30 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-900/60"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.54727 9.73562C4.04577 7.87521 5.14421 6.23127 6.67225 5.05877C8.20028 3.88627 10.0725 3.25073 11.9985 3.25073C13.9246 3.25073 15.7968 3.88627 17.3248 5.05877C18.8529 6.23127 19.9513 7.87521 20.4498 9.73562C20.5515 10.115 20.6163 10.381 20.6551 10.5642M20.4525 14.2639C19.954 16.1243 18.8556 17.7682 17.3276 18.9407C15.7995 20.1132 13.9273 20.7488 12.0013 20.7488C10.0752 20.7488 8.20299 20.1132 6.67496 18.9407C5.14693 17.7682 4.04848 16.1243 3.54999 14.2639C3.4463 13.8769 3.38051 13.6079 3.34134 13.4244M17.4804 8.99641L20.5611 10.7311L20.6551 10.5642M22.2957 7.65009L20.6551 10.5642M6.50967 15.0035L3.42896 13.2688L3.34134 13.4244M1.69434 16.3498L3.34134 13.4244"
                stroke="#323544"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </>
  );
}
