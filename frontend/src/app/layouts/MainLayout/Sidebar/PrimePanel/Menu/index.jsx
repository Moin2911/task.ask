// Import Dependencies
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import SimpleBar from "simplebar-react";

// Local Imports
import { isRouteActive } from "utils/isRouteActive";
import {
  useDataScrollOverflow,
  useDidUpdate,
  useIsomorphicEffect,
} from "hooks";
import { CollapsibleItem } from "./CollapsibleItem";
import { GroupItem } from "./GroupItem";
import { Accordion } from "components/ui";
import { MenuItem } from "./MenuItem";
import { Divider } from "./Divider";
import {
  NAV_TYPE_COLLAPSE,
  NAV_TYPE_DIVIDER,
  NAV_TYPE_ITEM,
  NAV_TYPE_GROUP,
} from "constants/app.constant";

// ----------------------------------------------------------------------

export function Menu({ nav, pathname }) {
  const initialActivePath = useMemo(() => {
    return nav.find((item) => isRouteActive(item.path, pathname))?.path;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { ref, recalculate } = useDataScrollOverflow();
  const [expanded, setExpanded] = useState(initialActivePath || "");

  useDidUpdate(recalculate, [nav]);

  useDidUpdate(() => {
    const activePath = nav.find((item) =>
      isRouteActive(item.path, pathname),
    )?.path;

    if (activePath && expanded !== activePath) {     
      setExpanded(activePath);
    }
  }, [nav, pathname]);

  useIsomorphicEffect(() => {
    const activeItem = ref?.current.querySelector("[data-menu-active=true]");
    activeItem?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <Accordion
      value={expanded}
      onChange={setExpanded}
      className="flex flex-col overflow-hidden"
    >
      <SimpleBar
        scrollableNodeProps={{ ref }}
        className="h-full max-h-[calc(100vh-190px)] overflow-x-hidden overflow-y-auto pb-6"
        style={{ "--scroll-shadow-size": "32px" }}
      >
        <div className="mt-9 flex min-h-0 flex-1 flex-col px-4">
          {nav.map((item) => {
            const itemKey = item.path || item.id;
            switch (item.type) {
              case NAV_TYPE_COLLAPSE:
                return <CollapsibleItem key={itemKey} data={item} />;
              case NAV_TYPE_GROUP:
                return <GroupItem key={itemKey} data={item} />;
              case NAV_TYPE_ITEM:
                return <MenuItem key={itemKey} data={item} />;
              case NAV_TYPE_DIVIDER:
                return <Divider key={itemKey} />;
              default:
                return null;
            }
          })}
        </div>
      </SimpleBar>
    </Accordion>
  );
}

Menu.propTypes = {
  nav: PropTypes.array,
};
