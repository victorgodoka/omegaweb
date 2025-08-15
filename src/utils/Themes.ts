export const dropdownTheme = {
  floating: {
    style: {
      dark: 'bg-zinc-800 text-white',
      light: 'bg-zinc-800 text-white',
      auto: 'bg-zinc-800 text-white',
    },
    item: {
      container: 'whitespace-nowrap'
    },
  },
  inlineWrapper: "flex items-center text-white"
};

export const inputTheme = {
  field: {
    input: {
      base: 'bg-zinc-950',
      colors: {
        omega: 'text-white border bg-zinc-950 border-omega-light'
      }
    }
  }
};

export const areaTheme = {
  colors: {
    omega: 'text-white border bg-zinc-900 border-omega-light'
  }
};

export const buttonTheme = {
  color: {
    omega: 'bg-omega-highlight hover:bg-omega-light font-bold text-white'
  }
};

export const footerTheme = {
  root: {
    base: "w-full shadow bg-zinc-800 md:flex md:items-center md:justify-between",
    container: "w-full py-6 px-10",
    bgDark: "bg-zinc-800"
  },
};

export const modalTheme = {
  header: {
    base: "flex items-start justify-between rounded-t border-b p-5 border-zinc-500 bg-zinc-800"
  },
  body: {
    base: "flex-1 overflow-auto bg-zinc-800 text-white",
    popup: "pt-0"
  },
  footer: {
    base: "flex items-center justify-center bg-zinc-800",
    popup: "border-0 py-2"
  }
};

export const tableTheme = {
  head: {
    cell: {
      base: "bg-zinc-950 px-6 py-3 group-first/head:first:rounded-tl-lg group-first/head:last:rounded-tr-lg"
    }
  },
  row: {
    hovered: "hover:bg-zinc-800/90",
    striped: "odd:bg-zinc-800/60 even:bg-zinc-800/90"
  }
};

export const tabsTheme = {
  base: 'w-full',
  tablist: {
    tabitem: {
      base: "flex items-center justify-center rounded-t-lg p-4 text-sm font-medium first:ml-0 disabled:cursor-not-allowed disabled:text-gray-400 disabled:dark:text-gray-500",
    },
  },
};

export const accordionTheme = {
  root: {
    base: 'divide-y-2 divide-gray-600',
  },
  content: {
    base: 'p-5 first:rounded-t-lg last:rounded-b-lg bg-zinc-900 text-white',
  },
  title: {
    base: 'flex w-full items-center justify-between p-5 text-left font-medium text-white first:rounded-t-lg last:rounded-b-lg bg-zinc-950',
    flush: {
      off: '',
      on: 'bg-transparent',
    },
    open: {
      off: '',
      on: 'bg-zinc-950 text-white',
    },
  },
};

export const accordionThemeDecklist = {
  ...accordionTheme,
  content: {
    base: 'p-0 first:rounded-t-lg last:rounded-b-lg dark:bg-[#01010b] text-white items-center justify-center [&:not([hidden])]:flex',
  },
};

export const drawerTheme = {
  root: {
    base: 'fixed z-[9999] overflow-y-auto p-4 transition-transform bg-zinc-950'
  }
};

export const sidebarTheme = {
  item: {
    base: "flex items-center justify-center rounded-lg p-2 text-base font-normal text-white hover:bg-zinc-800 bg-zinc-950",
    active: "bg-omega-highlight"
  },
  root: {
    inner: "h-full overflow-y-auto overflow-x-hidden rounded bg-zinc-950 px-3 py-4"
  }
};

export const paginationTheme = {
  base: "",
  layout: {
    table: {
      base: "text-sm text-zinc-400",
      span: "font-semibold text-white"
    }
  },
  pages: {
    base: "xs:mt-0 mt-2 inline-flex items-center -space-x-px",
    showIcon: "inline-flex",
    previous: {
      base: "ml-0 rounded-l-lg border px-3 py-2 leading-tight border-zinc-700 bg-zinc-800 text-zinc-400 enabled:hover:bg-zinc-700 enabled:hover:text-white",
      icon: "h-5 w-5"
    },
    next: {
      base: "rounded-r-lg border px-3 py-2 leading-tight border-zinc-700 bg-zinc-800 text-zinc-400 enabled:hover:bg-zinc-700 enabled:hover:text-whit ",
      icon: "h-5 w-5"
    },
    selector: {
      base: "w-12 border py-2 leading-tight border-zinc-700 bg-zinc-800 text-zinc-400 enabled:hover:bg-zinc-700 enabled:hover:text-white",
      active: "hover:bg-cyan-100 hover:text-cyan-700 border-zinc-700 bg-zinc-700 text-white",
      disabled: "cursor-not-allowed opacity-50"
    }
  }
}

export const selectStyle = {
  control: (baseStyles: any, { isDisabled }: any) => ({
    ...baseStyles,
    backgroundColor: '#27272a',
    color: '#fff',
    borderColor: '#18181b',
    cursor: 'pointer',
    outline: 'none',
    opacity: isDisabled ? '.255' : '1',
    width: '100%',
    paddingTop: '8px',
    paddingBottom: '8px',
  }),
  container: (baseStyles: any) => ({
    ...baseStyles,
    width: '100%'
  }),
  menu: (baseStyles: any) => ({
    ...baseStyles,
    color: '#fff',
    backgroundColor: '#27272a',
    borderColor: '#18181b',
  }),
  option: (baseStyles: any) => ({
    ...baseStyles,
    backgroundColor: '#27272a',
    borderColor: '#18181b',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#18181b',
    }
  }),
  singleValue: (baseStyles: any) => ({
    ...baseStyles,
    color: '#fff',
  }),
  multiValue: (baseStyles: any) => ({
    ...baseStyles,
    backgroundColor: '#18181b',
  }),
  multiValueLabel: (baseStyles: any) => ({
    ...baseStyles,
    color: '#fff'
  }),
}
