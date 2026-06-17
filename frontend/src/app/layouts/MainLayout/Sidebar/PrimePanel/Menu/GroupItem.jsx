// Import Dependencies
import PropTypes from "prop-types";

// Local Imports
import { MenuItem } from "./MenuItem";
import { NAV_TYPE_ITEM } from "constants/app.constant";

// ----------------------------------------------------------------------

export function GroupItem({ data }) {
  const { title, childs } = data;

  return (
    <div className="py-2">
      <div className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-300">
        {title}
      </div>
      <div className="space-y-0.5">
        {childs?.map((item) => {
          if (item.type === NAV_TYPE_ITEM) {
            return <MenuItem key={item.path} data={item} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

GroupItem.propTypes = {
  data: PropTypes.object,
};