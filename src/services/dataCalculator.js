/**
 * Data calculation service for patient data
 * This service connects to Supabase and calculates various metrics
 * based on patient ID
 */

/**
 * Calculate wrapped data for a profile
 * @param {Object} supabase - Supabase client instance
 * @param {number} profileId - The profile ID to calculate data for
 * @param {number} year - The year to calculate data for (defaults to current year)
 * @returns {Promise<Object>} WrappedData object
 */
export async function calculatePatientData(supabase, profileId, year = new Date().getFullYear()) {
  try {
    console.log(`\n=== Starting calculation for profileId: ${profileId}, year: ${year} ===`);

    // Calculate date range for the year
    const yearStart = new Date(year, 0, 1); // January 1st
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st, end of day
    console.log(`Year range: ${yearStart.toISOString()} to ${yearEnd.toISOString()}`);

    // 1. Fetch profile information
    console.log(`Fetching profile for id: ${profileId}`);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }
    console.log('Profile fetched:', profile ? { id: profile.id, first_name: profile.first_name, last_name: profile.last_name } : 'null');

    // Convert SQL query to Supabase client queries
    // This matches the SQL query structure provided

    // 1. Fetch all purchases for this profile in the specified year
    console.log(`Fetching purchases for profileId: ${profileId}, year: ${year}`);
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchase')
      .select('id, created_at')
      .eq('purchase_user', profileId)
      .gte('created_at', yearStart.toISOString())
      .lte('created_at', yearEnd.toISOString());

    if (purchasesError) {
      console.error('Purchases fetch error:', purchasesError);
      throw new Error(`Failed to fetch purchases: ${purchasesError.message}`);
    }

    console.log(`Found ${purchases?.length || 0} purchases in year ${year}`);
    if (purchases && purchases.length > 0) {
      console.log('Sample purchases:', purchases.slice(0, 3).map(p => ({ id: p.id, created_at: p.created_at })));
    }

    const purchaseIds = purchases?.map(p => p.id) || [];
    console.log(`Purchase IDs:`, purchaseIds);

    // 2. Fetch all list items for these purchases (user_stats and most_expensive_items)
    let listItems = [];
    if (purchaseIds.length > 0) {
      console.log(`Fetching list items for ${purchaseIds.length} purchases`);
      const { data: items, error: itemsError } = await supabase
        .from('list_item')
        .select('id, purchase_id, title, price, link, thumbnail_url')
        .in('purchase_id', purchaseIds);

      if (itemsError) {
        console.error('List items fetch error:', itemsError);
        throw new Error(`Failed to fetch list items: ${itemsError.message}`);
      }

      listItems = items || [];
      console.log(`Found ${listItems.length} list items`);
      if (listItems.length > 0) {
        console.log('Sample list items:', listItems.slice(0, 3).map(item => ({
          id: item.id,
          purchase_id: item.purchase_id,
          title: item.title,
          price: item.price
        })));
      }
    } else {
      console.log('No purchases found, skipping list items fetch');
    }

    // 3. Calculate user_stats: items_bought, spent, max_price
    // items_bought = COUNT(DISTINCT purchase.id) from SQL, but for totalGiftsGiven we want total items
    // SQL counts distinct purchases, but we'll count total list items for gifts
    const itemsBought = listItems.length;
    console.log(`Items bought (total list items): ${itemsBought}`);

    // spent = SUM(list_item.price)
    const spent = listItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    console.log(`Total spent: ${spent}`);

    // max_price = MAX(list_item.price)
    const maxPrice = listItems.length > 0
      ? Math.max(...listItems.map(item => parseFloat(item.price) || 0))
      : 0;
    console.log(`Max price: ${maxPrice}`);

    // 4. Find most_expensive_items: most expensive item per profile
    const mostExpensiveItem = listItems.length > 0
      ? listItems.reduce((max, item) => {
        const itemPrice = parseFloat(item.price) || 0;
        const maxPrice = parseFloat(max.price) || 0;
        return itemPrice > maxPrice ? item : max;
      }, listItems[0])
      : null;
    console.log('Most expensive item:', mostExpensiveItem ? {
      title: mostExpensiveItem.title,
      price: mostExpensiveItem.price,
      thumbnail_url: mostExpensiveItem.thumbnail_url
    } : 'null');

    // 5. Calculate last_minute_count: items in purchases between Dec 18 and < Dec 26
    // Note: SQL counts purchases, but we'll count items to match user expectation
    // SQL uses < '2024-12-26'::date which means up to Dec 25 inclusive
    const lastMinuteStart = new Date(year, 11, 17).toISOString(); // Dec 18, 00:00:00
    const lastMinuteEnd = new Date(year, 11, 26).toISOString(); // Dec 26, 00:00:00 (exclusive)
    console.log(`\nLast minute range for year ${year}: ${lastMinuteStart} to ${lastMinuteEnd} (exclusive)`);

    // Get purchases in last minute range
    console.log(`Fetching last minute purchases for profileId: ${profileId}`);
    const { data: lastMinutePurchaseData, error: lastMinutePurchaseError } = await supabase
      .from('purchase')
      .select('id, created_at')
      .eq('purchase_user', profileId)
      .gte('created_at', lastMinuteStart)
      .lt('created_at', lastMinuteEnd);

    let lastMinutePurchases = 0;
    if (lastMinutePurchaseError) {
      console.error('Error calculating last minute purchases:', lastMinutePurchaseError);
    } else {
      console.log(`Found ${lastMinutePurchaseData?.length || 0} purchases in last minute range`);
      if (lastMinutePurchaseData && lastMinutePurchaseData.length > 0) {
        console.log('Last minute purchases:', lastMinutePurchaseData.map(p => ({ id: p.id, created_at: p.created_at })));
        // Count items in last minute purchases
        const lastMinutePurchaseIds = lastMinutePurchaseData.map(p => p.id);
        console.log(`Counting items for ${lastMinutePurchaseIds.length} last minute purchases`);
        const { count: itemsCount, error: itemsCountError } = await supabase
          .from('list_item')
          .select('*', { count: 'exact', head: true })
          .in('purchase_id', lastMinutePurchaseIds);

        if (itemsCountError) {
          console.error('Error counting last minute items:', itemsCountError);
        } else {
          lastMinutePurchases = itemsCount || 0;
          console.log(`Last minute items count: ${lastMinutePurchases}`);
        }
      } else {
        console.log('No purchases found in last minute range');
      }
    }

    // 6. List Statistics
    console.log(`\n=== Fetching List Statistics ===`);

    // Fetch lists created by this profile in the year
    // Try common table names: lists, gift_lists, wishlists
    let lists = [];
    let totalListsCreated = 0;
    let listWithMostItems = null;

    // Try to fetch from 'lists' table (adjust table name if different)
    console.log(`Fetching lists for profileId: ${profileId}, year: ${year}`);
    const { data: listsData, error: listsError } = await supabase
      .from('list')
      .select('id, name, created_at, owner_user_id')
      .eq('owner_user_id', profileId)
      .gte('created_at', yearStart.toISOString())
      .lte('created_at', yearEnd.toISOString());


    lists = listsData || [];


    totalListsCreated = lists.length;
    console.log(`Total lists created in year ${year}: ${totalListsCreated}`);
    if (lists.length > 0) {
      console.log('Sample lists:', lists.slice(0, 3).map(l => ({ id: l.id, name: l.name, created_at: l.created_at })));
    }

    // Find list with most items
    if (lists.length > 0) {
      console.log(`Finding list with most items...`);
      const listIds = lists.map(l => l.id);

      // Count items per list
      const { data: listItemsCount, error: listItemsCountError } = await supabase
        .from('list_item')
        .select('list_id, id')
        .in('list_id', listIds);


      // Count items per list
      const listItemCounts = {};
      listItemsCount?.forEach(item => {
        const listId = item.list_id;
        listItemCounts[listId] = (listItemCounts[listId] || 0) + 1;
      });

      // Find list with most items
      let maxCount = 0;
      let maxListId = null;
      Object.entries(listItemCounts).forEach(([listId, count]) => {
        if (count > maxCount) {
          maxCount = count;
          maxListId = parseInt(listId);
        }
      });

      if (maxListId) {
        const maxList = lists.find(l => l.id === maxListId);
        if (maxList) {
          listWithMostItems = {
            id: maxList.id,
            name: maxList.name || 'Unnamed List',
            itemCount: maxCount
          };
          console.log(`List with most items:`, listWithMostItems);
        }
      }

    }

    // Find day/time when most items were added
    // Using list_item table joined with list to filter by list.owner_user_id
    console.log(`Finding day/time with most items added using list.owner_user_id...`);
    let mostActiveDay = null;
    let itemsOnDay = null;
    let suggestedGiftCountsArray = [];

    // First, get all list IDs owned by this user
    console.log(`Fetching lists owned by profileId: ${profileId}`);
    const { data: userLists, error: userListsError } = await supabase
      .from('list')
      .select('id')
      .eq('owner_user_id', profileId);

    if (userListsError) {
      console.error('Error fetching user lists:', userListsError);
    } else {
      const userListIds = userLists?.map(l => l.id) || [];
      console.log(`Found ${userListIds.length} lists owned by user`);

      if (userListIds.length > 0) {
        // Fetch all list items from these lists created in the year
        console.log(`Fetching list items for list_ids: ${userListIds.length} lists, year: ${year}`);
        const { data: userListItems, error: userListItemsError } = await supabase
          .from('list_item')
          .select('id, created_at, suggested_by')
          .in('list_id', userListIds)
          .gte('created_at', yearStart.toISOString())
          .lte('created_at', yearEnd.toISOString());

        console.log(`Query result:`, userListItems?.length || 0, 'items found');

        if (userListItemsError) {
          console.error('Error fetching user list items:', userListItemsError);
        } else {
          console.log(`Found ${userListItems?.length || 0} list items created by user in year ${year}`);

          if (userListItems && userListItems.length > 0) {
            // Group items by date (day)
            const itemsByDate = {};
            userListItems.forEach(item => {
              if (item.created_at) {
                if (item.suggested_by) {
                  return;
                }
                const date = new Date(item.created_at);
                const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
                if (!itemsByDate[dateKey]) {
                  itemsByDate[dateKey] = {
                    date: dateKey,
                    datetime: item.created_at,
                    count: 0
                  };
                }
                itemsByDate[dateKey].count++;
              }
            });

            console.log(`Items grouped by date:`, Object.keys(itemsByDate).length, 'unique days');

            // Find the day with most items
            let maxDayCount = 0;
            let maxDay = null;
            Object.values(itemsByDate).forEach(dayData => {
              if (dayData.count > maxDayCount) {
                maxDayCount = dayData.count;
                maxDay = dayData;
              }
            });

            if (maxDay) {
              mostActiveDay = {
                date: maxDay.date,
                datetime: maxDay.datetime,
                itemCount: maxDay.count
              };
              console.log(`Most active day:`, mostActiveDay);

              // Get all items added on that day
              console.log('Fetching items added on most active day...');
              const dayStart = new Date(maxDay.date);
              dayStart.setHours(0, 0, 0, 0);
              const dayEnd = new Date(maxDay.date);
              dayEnd.setHours(23, 59, 59, 999);

              // Get list IDs owned by user (reuse from above if available, or fetch again)
              const userListIdsForDay = userListIds || [];
              if (userListIdsForDay.length === 0) {
                const { data: userListsForDay } = await supabase
                  .from('list')
                  .select('id')
                  .eq('owner_user_id', profileId);
                userListIdsForDay.push(...(userListsForDay?.map(l => l.id) || []));
              }

              const { data: itemsOnDayData, error: itemsOnDayError } = await supabase
                .from('list_item')
                .select('id, title, price, link, thumbnail_url, created_at, suggested_by')
                .in('list_id', userListIdsForDay)
                .is('suggested_by', null)
                .gte('created_at', dayStart.toISOString())
                .lte('created_at', dayEnd.toISOString())
                .order('created_at', { ascending: true });

              if (itemsOnDayError) {
                console.error('Error fetching items on most active day:', itemsOnDayError);
              } else {
                itemsOnDay = itemsOnDayData || [];
                console.log(`Found ${itemsOnDay.length} items on most active day`);
              }
            } else {
              console.log('No active day found');
            }
          } else {
            console.log('No list items found for user in this year');
          }
        }
      } else {
        console.log('No lists found for user, skipping most active day calculation');
      }

      console.log("========== Get suggested gifts FOR this user ==========");
      // Get gifts suggested FOR this user (gifts suggested for lists owned by this user)
      // We already have userListIds from above - these are lists owned by the user
      if (userListIds && userListIds.length > 0) {
        console.log(`Fetching suggested gifts for lists owned by profileId: ${profileId}`);
        const { data: suggestedGifts, error: suggestedGiftsError } = await supabase
          .from('list_item')
          .select('suggested_by, list_id, created_at')
          .in('list_id', userListIds)
          .not('suggested_by', 'is', null)
          .gte('created_at', yearStart.toISOString())
          .lte('created_at', yearEnd.toISOString());

        if (suggestedGiftsError) {
          console.error('Error fetching suggested gifts:', suggestedGiftsError);
        } else {
          console.log(`Found ${suggestedGifts?.length || 0} suggested gifts for this user`);

          // Group by suggested_by to count who suggested the most gifts for this user
          const suggestedGiftCounts = {};
          suggestedGifts?.forEach(gift => {
            const suggesterId = gift.suggested_by;
            if (suggesterId) {
              suggestedGiftCounts[suggesterId] = (suggestedGiftCounts[suggesterId] || 0) + 1;
            }
          });

          // Convert to array and sort by count
          suggestedGiftCountsArray = Object.entries(suggestedGiftCounts)
            .map(([suggested_by, count]) => ({
              suggested_by: parseInt(suggested_by),
              count: count
            }))
            .sort((a, b) => b.count - a.count);

          // Get profile info for all suggesters
          const suggesterIds = suggestedGiftCountsArray.map(s => s.suggested_by);

          const { data: suggestedInfo, error: suggestedInfoError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', suggesterIds);

          if (suggestedInfoError) {
            console.error('Error fetching suggested info:', suggestedInfoError);
          } else {
            // Create a map for quick lookup
            const profileMap = {};
            suggestedInfo.forEach(profile => {
              profileMap[profile.id] = `${profile.first_name} ${profile.last_name}`;
            });

            // Add names to the counts array
            suggestedGiftCountsArray = suggestedGiftCountsArray.map(item => ({
              ...item,
              name: profileMap[item.suggested_by] || 'Unknown'
            }));
          }

          console.log('Suggested gift counts (who suggested the most for this user):', suggestedGiftCountsArray);
          // Total suggested gifts for this user
          const totalSuggestedGifts = suggestedGifts?.length || 0;
          console.log(`Total suggested gifts for this user: ${totalSuggestedGifts}`);
        }
      } else {
        console.log('No lists found for user, skipping suggested gifts calculation');
      }
    }

    // Return data structure matching WrappedData type
    const result = {
      profileId: parseInt(profileId),
      year: parseInt(year),
      stats: {
        totalGiftsGiven: itemsBought, // items_bought from user_stats
        totalGiftsReceived: 0, // TODO: Add query for gifts received
        mostExpensiveGift: {
          title: mostExpensiveItem?.title || '',
          price: mostExpensiveItem ? parseFloat(mostExpensiveItem.price) || 0 : 0,
          thumbnail_url: mostExpensiveItem?.thumbnail_url || null,
        },
        totalSpending: spent, // spent from user_stats
        peopleExchangedWith: 0, // TODO: Add query for unique people
        mostPopularCategory: '', // TODO: Add query for category
        giftGivingStreak: 0, // TODO: Add query for streak calculation
        santaScore: 0, // TODO: Add calculation for santa score
        lastMinutePurchases: lastMinutePurchases || 0, // last_minute_purchases from last_minute_count
        mostUsedRetailer: '', // TODO: Extract from link/retailer data
        homemadeGifts: 0, // TODO: Add query for homemade gifts
        purchaseTiming: {
          earlyBird: 0, // TODO: Add calculation based on dates
          onTime: 0, // TODO: Add calculation based on dates
          lastMinute: lastMinutePurchases || 0, // Using last minute count
        },
      },
      personalityType: '', // TODO: Calculate based on stats
      personalityReason: '', // TODO: Generate reason based on personality type
      // List statistics
      listStats: {
        totalListsCreated: totalListsCreated,
        listWithMostItems: listWithMostItems ? {
          name: listWithMostItems.name,
          itemCount: listWithMostItems.itemCount
        } : null,
        mostActiveDay: mostActiveDay ? {
          date: mostActiveDay.date,
          datetime: mostActiveDay.datetime,
          itemCount: mostActiveDay.itemCount,
          items: itemsOnDay,
        } : null,
        suggestedGiftCounts: suggestedGiftCountsArray,
      },
    };

    console.log('\n=== Final Result ===');
    console.log(JSON.stringify(result, null, 2));
    console.log('=== Calculation Complete ===\n');

    return result;
  } catch (error) {
    console.error(`Error in calculatePatientData for profile ${profileId}:`, error);
    throw error;
  }
}

